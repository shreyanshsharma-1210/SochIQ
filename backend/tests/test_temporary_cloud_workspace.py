import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_session_lifecycle_and_reload():
    # 1. Initialize workspace session
    resp = client.post("/api/v1/session/initialize")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "active"
    assert "session_id" in data
    assert "owner_id" in data
    assert data["is_active"] is True
    assert "datalens_session" in client.cookies

    # 2. Simulate page reload (GET /api/v1/session using existing cookie)
    reload_resp = client.get("/api/v1/session")
    assert reload_resp.status_code == 200
    reload_data = reload_resp.json()
    assert reload_data["session_id"] == data["session_id"]
    assert reload_data["owner_id"] == data["owner_id"]


def test_dataset_upload_storage_and_reopen():
    # 1. Initialize session
    init_res = client.post("/api/v1/session/initialize")
    assert init_res.status_code == 200

    # 2. Upload CSV dataset 1 (orders.csv)
    csv1 = "order_id,amount,region\n101,250.0,North\n102,150.5,South\n103,420.0,East\n"
    up1 = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("orders.csv", io.BytesIO(csv1.encode()), "text/csv")}
    )
    assert up1.status_code == 200
    data1 = up1.json()
    ds1_id = data1["dataset_id"]
    assert data1["filename"] == "orders.csv"
    assert data1["row_count"] == 3
    assert data1["column_count"] == 3
    assert "sochiq-temporary-datasets" in data1.get("storage_path", "") or "orders.csv" in data1.get("storage_path", "")

    # 3. Upload CSV dataset 2 (customers.csv) - verify multiple datasets coexistence
    csv2 = "cust_id,name,score\nC1,Alice,85\nC2,Bob,92\n"
    up2 = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("customers.csv", io.BytesIO(csv2.encode()), "text/csv")}
    )
    assert up2.status_code == 200
    data2 = up2.json()
    ds2_id = data2["dataset_id"]
    assert ds2_id != ds1_id
    assert data2["filename"] == "customers.csv"

    # 4. List all datasets in workspace
    list_res = client.get("/api/v1/datasets")
    assert list_res.status_code == 200
    datasets = list_res.json()
    ids = [d["id"] for d in datasets]
    assert ds1_id in ids
    assert ds2_id in ids

    # 5. Reopen dataset 1 (orders.csv) without re-uploading
    reopen_res = client.get(f"/api/v1/datasets/{ds1_id}")
    assert reopen_res.status_code == 200
    reopen_data = reopen_res.json()
    assert reopen_data["dataset"]["original_filename"] == "orders.csv"
    assert "preview" in reopen_data
    assert reopen_data["preview"]["row_count"] == 3

    # 6. Download original file from cloud storage
    file_res = client.get(f"/api/v1/datasets/{ds1_id}/file")
    assert file_res.status_code == 200
    assert b"order_id,amount,region" in file_res.content

    # 7. Delete dataset 2 (customers.csv)
    del_res = client.delete(f"/api/v1/datasets/{ds2_id}")
    assert del_res.status_code == 200

    # Verify dataset 2 is gone, dataset 1 remains
    list_after = client.get("/api/v1/datasets").json()
    ids_after = [d["id"] for d in list_after]
    assert ds2_id not in ids_after
    assert ds1_id in ids_after


def test_analysis_history_workflow():
    init_res = client.post("/api/v1/session/initialize")
    assert init_res.status_code == 200

    # Upload test dataset
    csv_data = "x,y\n1,10\n2,20\n3,30\n"
    up = client.post(
        "/api/v1/datasets/upload",
        files={"file": ("data.csv", io.BytesIO(csv_data.encode()), "text/csv")}
    )
    ds_id = up.json()["dataset_id"]

    # Check analyses list (initial_profile should already be recorded)
    history_res = client.get(f"/api/v1/analyses?dataset_id={ds_id}")
    assert history_res.status_code == 200
    runs = history_res.json()
    assert len(runs) >= 1
    assert runs[0]["analysis_type"] == "initial_profile"

    # Record a custom analysis run
    custom_run = client.post(
        f"/api/v1/analyses/dataset/{ds_id}",
        json={
            "analysis_type": "revenue_aggregation",
            "parameters": {"group_by": "x"},
            "result_summary": {"total_sum": 60}
        }
    )
    assert custom_run.status_code == 200
    assert custom_run.json()["analysis_type"] == "revenue_aggregation"

    # Verify both runs appear in history
    runs_after = client.get(f"/api/v1/analyses?dataset_id={ds_id}").json()
    types = [r["analysis_type"] for r in runs_after]
    assert "initial_profile" in types
    assert "revenue_aggregation" in types

