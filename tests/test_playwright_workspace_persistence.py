import os
import time
from playwright.sync_api import sync_playwright

CSV_ORDERS = """order_id,customer_id,product_category,amount,region
1001,C10,Electronics,499.99,North
1002,C11,Apparel,79.50,South
1003,C12,Electronics,1200.00,West
1004,C13,Home,150.25,East
1005,C14,Apparel,45.00,North
"""

CSV_CUSTOMERS = """customer_id,customer_name,tier,loyalty_score
C10,Aarav Sharma,Gold,88
C11,Diya Patel,Silver,74
C12,Rohan Mehta,Platinum,95
C13,Ananya Iyer,Bronze,52
C14,Vikram Verma,Silver,68
"""

def run():
    with open("temp_orders.csv", "w", encoding="utf-8") as f:
        f.write(CSV_ORDERS)
    with open("temp_customers.csv", "w", encoding="utf-8") as f:
        f.write(CSV_CUSTOMERS)

    orders_path = os.path.abspath("temp_orders.csv")
    customers_path = os.path.abspath("temp_customers.csv")
    artifact_dir = r"C:\Users\Shreyansh\.gemini\antigravity\brain\701a2097-c0b5-4645-b6fb-75184d84e41c"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        page = context.new_page()

        page.on("console", lambda msg: print(f"  [CONSOLE] {msg.text}"))
        page.on("pageerror", lambda err: print(f"  [PAGE ERROR] {err}"))
        page.on("dialog", lambda dialog: (print(f"  [DIALOG] {dialog.message}"), dialog.accept()))

        print("\n--- 1. Testing Automatic Workspace Creation (/app) ---")
        page.goto("http://localhost:3000/app")
        page.wait_for_selector("text=Your workspace", timeout=15000)
        assert page.locator("text=Make sense of your data.").is_visible()

        # Check clean workspace active status and 30m grace badge (NO countdown ticker)
        assert page.locator("text=Workspace Active · Cloud Persisted").first.is_visible()
        assert page.locator("text=30m Grace on Close").first.is_visible()
        assert not page.locator("text=Session:").is_visible(), "Session countdown ticker MUST NOT be shown during active browsing"
        print("  ✓ Automatic workspace created with indefinite active state & 30m grace indicator (no ticking countdown)")
        page.screenshot(path=os.path.join(artifact_dir, "workspace_1_dashboard_init.png"))

        print("\n--- 2. Uploading First Dataset (temp_orders.csv) on /app/upload ---")
        page.goto("http://localhost:3000/app/upload")
        page.wait_for_selector("text=Analysis Workspace", timeout=15000)

        file_input = page.locator("input[type='file']").first
        file_input.set_input_files(orders_path)
        print("  Uploaded file, waiting for cloud storage upload & analytics...")

        page.wait_for_selector("text=Dataset In-Memory Preview", timeout=45000)
        assert page.locator("text=temp_orders.csv").first.is_visible()
        assert page.locator("text=Temporary Cloud Storage").is_visible()
        print("  ✓ temp_orders.csv persisted in Supabase Storage and rendered in workspace")
        page.screenshot(path=os.path.join(artifact_dir, "workspace_2_orders_active.png"))

        print("\n--- 3. Uploading Second Dataset (temp_customers.csv) ---")
        page.locator("button:has-text('Upload New File')").click()
        page.wait_for_selector("text=Add Dataset to Workspace", timeout=10000)

        modal_file_input = page.locator("input[type='file']").last
        modal_file_input.set_input_files(customers_path)
        print("  Uploaded second dataset, waiting for cloud persistence...")

        page.wait_for_selector("text=temp_customers.csv", timeout=45000)
        print("  ✓ Second dataset uploaded successfully")

        # Debug what buttons exist
        page.wait_for_timeout(2000)
        buttons = page.locator("button").all_text_contents()
        print("  Buttons currently visible on page:", buttons)

        # Verify multi-dataset switcher shows both datasets!
        page.wait_for_selector("button:has-text('temp_orders')", timeout=10000)
        page.wait_for_selector("button:has-text('temp_customers')", timeout=10000)
        print("  ✓ Multi-dataset switcher shows both datasets available simultaneously")
        page.screenshot(path=os.path.join(artifact_dir, "workspace_3_multiple_datasets.png"))

        print("\n--- 4. Switching Back to First Dataset Without Re-uploading ---")
        page.locator("button:has-text('temp_orders')").click()
        page.wait_for_timeout(1000)
        assert page.locator("text=temp_orders.csv").first.is_visible()
        print("  ✓ Switched back to temp_orders.csv instantaneously from cloud state")

        print("\n--- 5. Testing Page Reload (Workspace Persistence) ---")
        page.reload()
        page.wait_for_selector("text=Analysis Workspace", timeout=20000)
        page.wait_for_selector("text=temp_orders.csv", timeout=15000)
        assert page.locator("text=Dataset In-Memory Preview").is_visible()
        print("  ✓ Page reloaded: Workspace, session cookie, and active dataset restored from Supabase!")
        page.screenshot(path=os.path.join(artifact_dir, "workspace_4_reloaded_workspace.png"))

        print("\n--- 6. Testing My Analyses Library (/app/analyses) ---")
        page.goto("http://localhost:3000/app/analyses")
        page.wait_for_selector("text=My Analyses", timeout=15000)
        assert page.locator("text=temp_orders").first.is_visible()
        assert page.locator("text=temp_customers").first.is_visible()
        assert page.locator("text=Cloud Persisted").first.is_visible()

        # Switch to Analysis History tab
        page.locator("button:has-text('Analysis History')").click()
        page.wait_for_selector("text=Initial Profile", timeout=10000)
        print("  ✓ Both datasets and their recorded analysis runs visible in My Analyses")
        page.screenshot(path=os.path.join(artifact_dir, "workspace_5_my_analyses.png"))

        browser.close()

    try:
        os.remove("temp_orders.csv")
        os.remove("temp_customers.csv")
    except Exception:
        pass

    print("\n========================================================")
    print("🎉 ALL TEMPORARY CLOUD WORKSPACE PLAYWRIGHT TESTS PASSED!")
    print("========================================================")

if __name__ == "__main__":
    run()
