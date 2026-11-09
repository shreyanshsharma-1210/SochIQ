import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "DataLens"
    assert data["mode"] == "memory-only"


def test_preview_csv():
    csv_content = b"name,age,city,salary\nAlice,30,New York,70000\nBob,25,San Francisco,85000\nCharlie,35,Boston,60000\nAlice,30,New York,70000\n"
    response = client.post(
        "/api/v1/datasets/preview",
        files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.csv"
    assert data["file_format"] == "csv"
    assert data["row_count"] == 4
    assert data["column_count"] == 4
    assert data["quality"]["duplicate_rows"] == 1
    assert "salary" in data["columns"]


def test_analytics_summary_csv():
    csv_content = b"category,revenue\nA,100\nB,200\nA,150\nC,300\n"
    response = client.post(
        "/api/v1/analytics/summary",
        files={"file": ("sales.csv", io.BytesIO(csv_content), "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "revenue" in data["numeric_columns"]
    assert data["numeric_columns"]["revenue"]["mean"] == 187.5
    assert data["numeric_columns"]["revenue"]["min"] == 100.0
    assert data["numeric_columns"]["revenue"]["max"] == 300.0


def test_rule_insights():
    csv_content = b"item,sales\nAlpha,500\nAlpha,600\nAlpha,700\nBeta,100\n"
    response = client.post(
        "/api/v1/insights/rules",
        files={"file": ("inventory.csv", io.BytesIO(csv_content), "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["insights"]) > 0


def test_export_pdf():
    csv_content = b"product,price\nWidget,19.99\nGadget,29.99\n"
    response = client.post(
        "/api/v1/exports/pdf",
        files={"file": ("products.csv", io.BytesIO(csv_content), "text/csv")}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 500


def test_export_csv():
    csv_content = b"id,val\n1,10\n1,10\n2,20\n"
    response = client.post(
        "/api/v1/exports/csv",
        files={"file": ("raw.csv", io.BytesIO(csv_content), "text/csv")}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert b"1,10\n2,20" in response.content or b"1,10\r\n2,20" in response.content


def test_ai_query_structured():
    payload = {
        "question": "What is the summary?",
        "summary_context": {
            "row_count": 100,
            "column_count": 3
        },
        "quality_context": {
            "cleanliness_score": 95
        }
    }
    response = client.post("/api/v1/ai/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "model" in data
    assert data["source"] == "groq"
    assert "structured" in data
    if data["structured"]:
        assert "response_type" in data["structured"]
        assert "message" in data["structured"]


