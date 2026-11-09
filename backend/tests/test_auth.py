from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_browser_session_lifecycle():
    # 1. Initialize browser session
    res = client.post("/api/v1/auth/session")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "active"
    assert "datalens_session" in client.cookies

    # 2. Access protected endpoint using session cookie
    csv_content = b"name,score\nAlice,95\nBob,88\n"
    res_preview = client.post(
        "/api/v1/datasets/preview",
        files={"file": ("test.csv", csv_content, "text/csv")}
    )
    assert res_preview.status_code == 200
    assert res_preview.json()["row_count"] == 2

    # 3. Explicit logout revokes session
    res_logout = client.post("/api/v1/auth/logout")
    assert res_logout.status_code == 200


def test_developer_api_key_lifecycle_and_scopes():
    # 1. Establish session first
    client.post("/api/v1/auth/session")

    # 2. Generate Developer API key
    res_key = client.post(
        "/api/v1/auth/keys/generate",
        json={"scopes": ["datasets:read", "analytics:read"]}
    )
    assert res_key.status_code == 200
    key_data = res_key.json()
    raw_key = key_data["api_key"]
    key_id = key_data["key_id"]
    assert raw_key.startswith("dl_live_")

    # 3. Use Developer API key in external client without session cookies
    ext_client = TestClient(app)  # Clean client with no cookies
    csv_content = b"x,y\n1,10\n2,20\n"
    res_ext = ext_client.post(
        "/api/v1/datasets/preview",
        files={"file": ("data.csv", csv_content, "text/csv")},
        headers={"Authorization": f"Bearer {raw_key}"}
    )
    assert res_ext.status_code == 200
    assert res_ext.json()["row_count"] == 2

    # 4. List user's active keys (only prefix returned)
    res_list = ext_client.get("/api/v1/auth/keys", headers={"Authorization": f"Bearer {raw_key}"})
    assert res_list.status_code == 200
    assert len(res_list.json()) > 0
    assert "api_key" not in res_list.json()[0]  # Original key NEVER returned again

    # 5. Revoke Developer API key
    res_rev = ext_client.delete(f"/api/v1/auth/keys/{key_id}", headers={"Authorization": f"Bearer {raw_key}"})
    assert res_rev.status_code == 200

    # 6. Verify revoked key is rejected
    res_rejected = ext_client.post(
        "/api/v1/datasets/preview",
        files={"file": ("data.csv", csv_content, "text/csv")},
        headers={"Authorization": f"Bearer {raw_key}"}
    )
    assert res_rejected.status_code == 401
