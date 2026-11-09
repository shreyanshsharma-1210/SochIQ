from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_fixture_csv_upload_and_preview():
    csv_path = FIXTURES_DIR / "sample_sales.csv"
    with open(csv_path, "rb") as f:
        response = client.post(
            "/api/v1/datasets/preview",
            files={"file": ("sample_sales.csv", f, "text/csv")}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["row_count"] == 1015
    assert data["column_count"] == 9
    assert data["quality"]["duplicate_rows"] == 15
    assert data["quality"]["cleanliness_score"] > 80.0


def test_fixture_xlsx_analytics():
    xlsx_path = FIXTURES_DIR / "sample_sales.xlsx"
    with open(xlsx_path, "rb") as f:
        response = client.post(
            "/api/v1/analytics/summary",
            files={"file": ("sample_sales.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
    assert response.status_code == 200
    data = response.json()
    assert "revenue" in data["numeric_columns"]
    assert data["numeric_columns"]["revenue"]["mean"] > 0
    assert "category" in data["categorical_columns"]


def test_fixture_json_insights_and_pdf():
    json_path = FIXTURES_DIR / "sample_sales.json"
    with open(json_path, "rb") as f:
        json_bytes = f.read()

    # Rule insights
    resp_insights = client.post(
        "/api/v1/insights/rules",
        files={"file": ("sample_sales.json", json_bytes, "application/json")}
    )
    assert resp_insights.status_code == 200
    assert len(resp_insights.json()["insights"]) > 0

    # PDF generation
    resp_pdf = client.post(
        "/api/v1/exports/pdf",
        files={"file": ("sample_sales.json", json_bytes, "application/json")}
    )
    assert resp_pdf.status_code == 200
    assert resp_pdf.headers["content-type"] == "application/pdf"
    assert len(resp_pdf.content) > 1000

