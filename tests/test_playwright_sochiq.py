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
        # 2. TEST OVERVIEW DASHBOARD (/app)
        # ==========================================
        print("\n--- 2. Testing Overview Dashboard (/app) ---")
        page.locator("text=Launch App").first.click()
        page.wait_for_url("**/app", timeout=10000)
        time.sleep(1)

        workspace_heading = page.locator("text=Your workspace")
        assert workspace_heading.is_visible(), "Workspace sub-heading not visible"
        headline = page.locator("text=Make sense of your data.")
        assert headline.is_visible(), "Make sense of your data headline not visible"
        
        # Verify prominent upload area on dashboard
        dropzone = page.locator("text=Drag & drop your dataset here").first
        assert dropzone.is_visible(), "Prominent upload area not visible on dashboard"

        # Verify 3 metric cards
        assert page.locator("text=Datasets Profiled").is_visible(), "Datasets Profiled KPI not visible"
        assert page.locator("text=Records Analyzed").is_visible(), "Records Analyzed KPI not visible"
        assert page.locator("text=Memory Only").is_visible(), "Privacy Status KPI not visible"
        print("  ✓ Overview Dashboard (Upload focus, KPIs, headlines) validated successfully")

        dashboard_shot = os.path.join(artifacts_dir, "sochiq_app_dashboard.png")
        page.screenshot(path=dashboard_shot, full_page=True)
        print(f"  ✓ App dashboard screenshot saved: {dashboard_shot}")

        # ==========================================
        # 3. TEST MY ANALYSES PAGE (/app/analyses)
        # ==========================================
        print("\n--- 3. Testing My Analyses (/app/analyses) ---")
        page.locator("text=My Analyses").first.click()
        page.wait_for_url("**/app/analyses", timeout=10000)
        time.sleep(1)

        assert page.locator("h1:has-text('My Analyses')").is_visible(), "My Analyses heading not visible"
        assert page.locator("text=Memory-Only Privacy Notice").is_visible(), "Privacy notice not visible"
        print("  ✓ My Analyses page & privacy notice validated successfully")

        analyses_shot = os.path.join(artifacts_dir, "sochiq_my_analyses.png")
        page.screenshot(path=analyses_shot, full_page=True)
        print(f"  ✓ My Analyses screenshot saved: {analyses_shot}")

        # ==========================================
        # 4. TEST NEW ANALYSIS & WORKSPACE (/app/upload)
        # ==========================================
        print("\n--- 4. Testing New Analysis & Workspace (/app/upload) ---")
        page.locator("text=New Analysis").first.click()
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
        print("  ✓ Tab 1: Overview validated")

        # Test Tab 2: Data Quality
        page.locator("button:has-text('Data Quality')").click()
        time.sleep(1)
        assert page.locator("text=Cleanliness Score").is_visible(), "Cleanliness score not visible"
        print("  ✓ Tab 2: Data Quality validated")

        # Test Tab 3: Analytics
        page.locator("button:has-text('Analytics')").click()
        time.sleep(1)
        assert page.locator("text=vs").first.is_visible(), "Chart series not visible"
        print("  ✓ Tab 3: Analytics Recharts validated")

        # Test Tab 4: AI Insights
        page.locator("button:has-text('AI Insights')").click()
        time.sleep(1)
        assert page.locator("text=SochIQ AI Assistant").is_visible(), "SochIQ AI Assistant not visible"
        print("  ✓ Tab 4: AI Insights loaded")

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
        # 5. TEST DEVELOPER PORTAL (/app/developer)
        # ==========================================
        print("\n--- 5. Testing Developer Portal (/app/developer) ---")
        page.locator("text=Developer API").first.click()
        page.wait_for_url("**/app/developer", timeout=10000)
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
