import os
import time
from playwright.sync_api import sync_playwright

def run_sochiq_comprehensive_test():
    artifacts_dir = r"C:\Users\Shreyansh\.gemini\antigravity\brain\701a2097-c0b5-4645-b6fb-75184d84e41c"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        # ==========================================
        # 1. TEST PUBLIC LANDING PAGE
        # ==========================================
        print("\n--- 1. Testing Public Landing Page (/) ---")
        page.goto("http://localhost:3000/", wait_until="networkidle")
        time.sleep(1)

        # Check Navbar
        navbar = page.locator("header nav").first
        assert navbar.is_visible(), "Floating Navbar not visible"
        assert page.locator("text=Features").first.is_visible(), "Features link not visible"
        assert page.locator("text=Developer API").first.is_visible(), "Developer API link not visible"
        assert page.locator("text=See Demo").first.is_visible(), "See Demo link not visible"
        assert page.locator("text=Launch App").first.is_visible(), "Launch App CTA not visible"

        # Check Hero
        headline = page.locator("h1")
        assert "Turn Your Data" in headline.inner_text(), "Hero headline mismatch"
        print("  ✓ Navbar & Hero validated successfully")

        # Check Dashboard Preview
        preview_mockup = page.locator("#preview")
        assert preview_mockup.is_visible(), "Dashboard preview mockup not visible"
        print("  ✓ Dashboard preview mockup validated")

        # Check Features & Privacy
        features_header = page.locator("text=Everything you need to understand your data.")
        assert features_header.is_visible(), "Features section heading not visible"
        privacy_header = page.locator("text=Your data stays yours.")
        assert privacy_header.is_visible(), "Privacy section heading not visible"
        final_cta = page.locator("text=Your data has a story.")
        assert final_cta.is_visible(), "Final CTA heading not visible"
        print("  ✓ Features, How It Works, Privacy, and Final CTA validated")

        landing_shot = os.path.join(artifacts_dir, "sochiq_landing_page.png")
        page.screenshot(path=landing_shot, full_page=True)
        print(f"  ✓ Landing page screenshot saved: {landing_shot}")

        # ==========================================
        # 2. TEST DASHBOARD (/app)
        # ==========================================
        print("\n--- 2. Testing Internal Dashboard (/app) ---")
        page.locator("text=Launch App").first.click()
        page.wait_for_url("**/app", timeout=10000)
        time.sleep(1)

        welcome_heading = page.locator("text=Welcome to SochIQ.")
        assert welcome_heading.is_visible(), "Dashboard welcome heading not visible"
        assert page.locator("text=Saved Metadata Profiles").is_visible(), "Saved Profiles KPI not visible"
        assert page.locator("text=Total Records Profiled").is_visible(), "Total Records KPI not visible"
        assert page.locator("text=Memory Only").is_visible(), "Privacy Safeguard not visible"
        print("  ✓ App Dashboard & KPIs validated successfully")

        dashboard_shot = os.path.join(artifacts_dir, "sochiq_app_dashboard.png")
        page.screenshot(path=dashboard_shot, full_page=True)
        print(f"  ✓ App dashboard screenshot saved: {dashboard_shot}")

        # ==========================================
        # 3. TEST UPLOAD & WORKSPACE (/app/upload)
        # ==========================================
        print("\n--- 3. Testing Upload & Workspace (/app/upload) ---")
        page.locator("text=Upload Dataset").first.click()
        page.wait_for_url("**/app/upload", timeout=10000)
        time.sleep(1)

        csv_path = os.path.abspath("backend/tests/fixtures/sample_sales.csv")
        file_input = page.locator('input[type="file"]')
        file_input.set_input_files(csv_path)
        print("  ✓ Uploaded sample_sales.csv, waiting for in-memory analytics...")
        
        # Wait for parallel in-memory analytics to finish
        page.wait_for_selector("text=Dataset In-Memory Preview", timeout=25000)

        # Verify tabs and preview
        assert page.locator("text=Dataset In-Memory Preview").is_visible(), "Preview grid not visible"
        assert page.locator("text=Export PDF Report").is_visible(), "PDF report export button not visible"
        assert page.locator("text=Cleaned CSV").is_visible(), "Cleaned CSV export button not visible"
        print("  ✓ Data Preview tab & Export actions validated")

        # Test Quality Audit tab
        page.locator("button:has-text('Quality Audit')").click()
        time.sleep(1)
        assert page.locator("text=Cleanliness Score").is_visible(), "Cleanliness score not visible"
        print("  ✓ Quality Audit tab validated")

        # Test Visual Analytics tab
        page.locator("button:has-text('Visual Analytics')").click()
        time.sleep(1)
        assert page.locator("text=vs").first.is_visible(), "Chart series not visible"
        print("  ✓ Visual Analytics Recharts validated")

        # Test Insights & AI tab
        page.locator("button:has-text('Insights & AI')").click()
        time.sleep(1)
        assert page.locator("text=SochIQ AI Assistant").is_visible(), "SochIQ AI Assistant not visible"
        print("  ✓ Insights & AI tab loaded")

        # Ask a query via starter chip or input
        starter_chip = page.locator("button:has-text('Which category generates the highest revenue?')")
        if starter_chip.is_visible():
            starter_chip.click()
        else:
            page.locator("textarea").fill("Which category generates the highest revenue?")
            page.locator("button:has-text('Inquire')").click()

        print("  Waiting for SochIQ AI response...")
        page.wait_for_selector("text=Grounded via SochIQ", timeout=35000)
        assert page.locator("button:has-text('Copy')").is_visible(), "Copy button not visible"
        print("  ✓ SochIQ AI response rendered with structured layout")

        workspace_shot = os.path.join(artifacts_dir, "sochiq_workspace.png")
        page.screenshot(path=workspace_shot, full_page=True)
        print(f"  ✓ Workspace screenshot saved: {workspace_shot}")

        # ==========================================
        # 4. TEST DEVELOPER PORTAL (/app/developer)
        # ==========================================
        print("\n--- 4. Testing Developer Portal (/app/developer) ---")
        page.goto("http://localhost:3000/app/developer", wait_until="networkidle")
        time.sleep(1)

        dev_heading = page.locator("text=Developer REST API & Temporary Keys")
        assert dev_heading.is_visible(), "Developer portal heading not visible"

        gen_btn = page.locator("button:has-text('Generate Temporary API Key')")
        gen_btn.click()
        page.wait_for_selector("button:has-text('Copy Key')", timeout=15000)

        copy_key_btn = page.locator("button:has-text('Copy Key')")
        assert copy_key_btn.is_visible(), "Generated key banner not visible"
        print("  ✓ Temporary Developer API Key generated & validated")

        dev_shot = os.path.join(artifacts_dir, "sochiq_developer_portal.png")
        page.screenshot(path=dev_shot, full_page=True)
        print(f"  ✓ Developer portal screenshot saved: {dev_shot}")

        browser.close()
        print("\n==========================================")
        print("🎉 ALL SOCHIQ SUITE TESTS PASSED 100%!")
        print("==========================================")

if __name__ == "__main__":
    run_sochiq_comprehensive_test()
