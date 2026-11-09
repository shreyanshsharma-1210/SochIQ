import os
import time
from playwright.sync_api import sync_playwright

def run_ai_interface_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("1. Navigating to upload page...")
        page.goto("http://localhost:3000/datasets/upload", wait_until="networkidle")
        time.sleep(1)

        print("2. Uploading sample_sales.csv...")
        csv_path = os.path.abspath("backend/tests/fixtures/sample_sales.csv")
        file_input = page.locator('input[type="file"]')
        file_input.set_input_files(csv_path)
        time.sleep(2)

        print("3. Generating analytics...")
        generate_btn = page.get_by_role("button", name="Generate Analytics")
        if generate_btn.is_visible():
            generate_btn.click()
            time.sleep(3)

        print("4. Switching to 'Insights & AI' tab...")
        insights_tab = page.locator("button:has-text('Insights & AI')")
        insights_tab.wait_for(state="visible", timeout=10000)
        insights_tab.click()
        time.sleep(1)

        print("5. Verifying Groq AI panel...")
        groq_header = page.locator("text=Groq Cloud AI Assistant")
        assert groq_header.is_visible(), "Groq Cloud AI Assistant header not visible"

        structured_badge = page.locator("text=Structured Insights")
        assert structured_badge.is_visible(), "Structured Insights badge not visible"

        print("6. Clicking starter query chip...")
        starter_chip = page.locator("button:has-text('Summarize key dataset dimensions')")
        if starter_chip.is_visible():
            starter_chip.click()
        else:
            textarea = page.locator("textarea")
            textarea.fill("Summarize key dataset dimensions and highlights")
            send_btn = page.locator("button:has-text('Inquire')")
            send_btn.click()

        print("7. Waiting for Groq structured interpretation...")
        # Wait up to 35s for the AI response to appear
        page.wait_for_selector("text=Grounded via Groq", timeout=35000)

        # Check for structured elements
        copy_btn = page.locator("button:has-text('Copy')")
        assert copy_btn.is_visible(), "Copy button not visible"

        print("8. Taking screenshot of Structured AI Insights Interface...")
        screenshot_path = r"C:\Users\Shreyansh\.gemini\antigravity\brain\701a2097-c0b5-4645-b6fb-75184d84e41c\ai_insights_screenshot.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()
        print("Test passed successfully!")

if __name__ == "__main__":
    run_ai_interface_test()
