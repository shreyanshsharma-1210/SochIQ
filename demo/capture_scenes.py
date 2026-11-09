import os
import time
from playwright.sync_api import sync_playwright

WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(WORKSPACE_DIR, "raw_recordings")
ORDERS_CSV = os.path.join(WORKSPACE_DIR, "sample_ecommerce_orders.csv")
CUSTOMERS_CSV = os.path.join(WORKSPACE_DIR, "sample_customer_loyalty.csv")

VIEWPORT = {"width": 1280, "height": 800}

def capture():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Starting Playwright authentic video capture...")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--enable-font-antialiasing", "--font-render-hinting=medium"]
        )

        context = browser.new_context(
            viewport=VIEWPORT,
            device_scale_factor=2,  # Retina crisp rendering
            record_video_dir=OUTPUT_DIR,
            record_video_size=VIEWPORT
        )

        page = context.new_page()

        page.on("console", lambda msg: print(f"  [CONSOLE] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"  [PAGE ERROR] {err}"))
        page.on("dialog", lambda d: (print(f"  [DIALOG] {d.message}"), d.accept()))

        # -------------------------------------------------------------
        # SCENE 1: Landing Page Journey (0:00 - 0:08)
        # -------------------------------------------------------------
        print("  -> Capturing Landing Page...")
        page.goto("http://localhost:3000/", wait_until="domcontentloaded")
        page.wait_for_selector("text=Think smarter.", timeout=15000)
        time.sleep(2.0)

        # Smooth scroll to features
        page.evaluate("""() => {
            window.scrollBy({ top: 600, behavior: 'smooth' });
        }""")
        time.sleep(2.5)

        # Smooth scroll to API preview
        page.evaluate("""() => {
            window.scrollBy({ top: 650, behavior: 'smooth' });
        }""")
        time.sleep(2.5)

        # -------------------------------------------------------------
        # SCENE 2: Workspace Session & Countdown (0:08 - 0:14)
        # -------------------------------------------------------------
        print("  -> Capturing Workspace Dashboard...")
        page.goto("http://localhost:3000/app", wait_until="domcontentloaded")
        page.wait_for_selector("text=Your workspace", timeout=15000)
        time.sleep(2.0)

        # Highlight countdown and cards
        page.hover("text=Session:")
        time.sleep(2.0)

        # -------------------------------------------------------------
        # SCENE 3: Dataset Ingestion & Deep Analytics (0:14 - 0:26)
        # -------------------------------------------------------------
        print("  -> Capturing Upload & Analytics Deep Dive...")
        page.goto("http://localhost:3000/app/upload", wait_until="domcontentloaded")
        page.wait_for_selector("text=Analysis Workspace", timeout=15000)
        time.sleep(1.0)

        # Upload first dataset
        file_input = page.locator("input[type='file']").first
        file_input.set_input_files(ORDERS_CSV)
        print("     Uploaded orders CSV, awaiting analysis...")

        page.wait_for_selector("text=Temporary Cloud Storage", timeout=60000)
        print("     ✓ Analysis rendered!")
        time.sleep(2.0)

        # Tab 1: Overview inspection
        page.evaluate("""() => {
            window.scrollBy({ top: 350, behavior: 'smooth' });
        }""")
        time.sleep(2.0)

        # Tab 2: Data Quality
        print("     Inspecting Data Quality Tab...")
        page.locator("button:has-text('Data Quality')").click()
        time.sleep(2.5)

        # Tab 3: Descriptive Analytics
        print("     Inspecting Analytics Tab...")
        page.locator("button:has-text('Analytics')").click()
        time.sleep(2.5)

        # Tab 4: AI Insights
        print("     Inspecting AI Insights Tab...")
        page.locator("button:has-text('AI Insights')").click()
        time.sleep(2.5)

        # -------------------------------------------------------------
        # SCENE 4: Multi-Dataset Switcher (0:26 - 0:34)
        # -------------------------------------------------------------
        print("  -> Capturing Multi-Dataset Switcher...")
        # Scroll back to top
        page.evaluate("""() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }""")
        time.sleep(1.0)

        page.locator("button:has-text('Upload New File')").click()
        page.wait_for_selector("text=Add Dataset to Workspace", timeout=10000)
        time.sleep(1.0)

        modal_file_input = page.locator("input[type='file']").last
        modal_file_input.set_input_files(CUSTOMERS_CSV)
        print("     Uploaded second dataset (customers)...")

        page.wait_for_selector("text=sample_customer_loyalty", timeout=45000)
        time.sleep(2.0)

        # Switch back to orders dataset
        orders_btn = page.locator("button:has-text('sample_ecommerce')").first
        if orders_btn.is_visible():
            print("     Switching back to orders dataset via header...")
            orders_btn.click()
            time.sleep(2.0)

        # -------------------------------------------------------------
        # SCENE 5: Developer API Portal (0:34 - 0:40)
        # -------------------------------------------------------------
        print("  -> Capturing Developer API Portal...")
        page.goto("http://localhost:3000/app/developer", wait_until="domcontentloaded")
        page.wait_for_selector("text=Developer API", timeout=15000)
        time.sleep(2.0)

        # Generate a live key
        gen_btn = page.locator("button:has-text('Generate Temporary Key')")
        if gen_btn.is_visible():
            gen_btn.click()
            time.sleep(2.5)

        video_path = page.video.path() if page.video else None
        print("Finished capturing all authentic scenes.")
        context.close()
        browser.close()

        if video_path and os.path.exists(video_path):
            target_path = os.path.join(OUTPUT_DIR, "sochiq_raw_walkthrough.webm")
            if os.path.exists(target_path):
                os.remove(target_path)
            os.rename(video_path, target_path)
            print(f"  ✓ Saved raw video to: {target_path}")

if __name__ == "__main__":
    capture()

