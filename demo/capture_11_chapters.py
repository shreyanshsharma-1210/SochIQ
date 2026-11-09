import os
import time
from playwright.sync_api import sync_playwright

WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(WORKSPACE_DIR, "raw_recordings", "chapters")
os.makedirs(OUT_DIR, exist_ok=True)

ORDERS_CSV = os.path.join(WORKSPACE_DIR, "sample_ecommerce_orders.csv")
VIEWER_HTML = os.path.join(WORKSPACE_DIR, "report_pages", "viewer.html")

VIEWPORT = {"width": 1440, "height": 900}

INJECT_CURSOR_JS = """
(() => {
    if (document.getElementById('sochiq-custom-cursor')) return;
    const cursor = document.createElement('div');
    cursor.id = 'sochiq-custom-cursor';
    cursor.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 26px;
        height: 26px;
        pointer-events: none;
        z-index: 2147483647;
        transform: translate(720px, 450px);
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.45));
    `;
    cursor.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 2L18.5 12.5L11 13.5L8 21.5L3 2Z" fill="#111111" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round"/>
            <polygon points="3,2 8,6 6,8" fill="#FFDF00"/>
        </svg>
    `;
    document.body.appendChild(cursor);

    window.__setCursorPos = (x, y) => {
        cursor.style.transform = `translate(${x}px, ${y}px)`;
    };

    window.__triggerClickRipple = (x, y) => {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: fixed;
            left: ${x - 22}px;
            top: ${y - 22}px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 3.5px solid #FFDF00;
            background: rgba(255, 223, 0, 0.45);
            pointer-events: none;
            z-index: 2147483646;
            transform: scale(0.3);
            opacity: 1;
            transition: transform 0.45s cubic-bezier(0.15, 0.85, 0.35, 1.2), opacity 0.45s ease-out;
            box-shadow: 0 0 14px rgba(255, 223, 0, 0.6);
        `;
        document.body.appendChild(ripple);
        requestAnimationFrame(() => {
            ripple.style.transform = 'scale(1.9)';
            ripple.style.opacity = '0';
        });
        setTimeout(() => ripple.remove(), 480);
    };
})();
"""

def setup_page(context, url):
    page = context.new_page()
    page.goto(url, wait_until="domcontentloaded")
    time.sleep(0.8)
    page.evaluate(INJECT_CURSOR_JS)
    return page

def smooth_move(page, start_x, start_y, end_x, end_y, steps=22, delay=0.015):
    for i in range(1, steps + 1):
        t = i / steps
        ease = t * t * (3.0 - 2.0 * t)
        curr_x = start_x + (end_x - start_x) * ease
        curr_y = start_y + (end_y - start_y) * ease
        page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
        time.sleep(delay)
    return end_x, end_y

def smooth_click(page, curr_x, curr_y, selector, steps=20):
    loc = page.locator(selector).first
    box = loc.bounding_box()
    if box:
        target_x = box['x'] + box['width'] / 2
        target_y = box['y'] + box['height'] / 2
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, target_x, target_y, steps)
        page.evaluate(f"window.__triggerClickRipple({target_x}, {target_y})")
        time.sleep(0.12)
        loc.click()
        time.sleep(0.3)
    return curr_x, curr_y

def smooth_scroll(page, delta_y, steps=15, delay=0.02):
    for i in range(steps):
        step_scroll = delta_y / steps
        page.evaluate(f"window.scrollBy(0, {step_scroll})")
        time.sleep(delay)

def record_chapter(browser, chapter_num, chapter_name, task_func):
    clip_path = os.path.join(OUT_DIR, f"chapter_{chapter_num:02d}_{chapter_name}.webm")
    if os.path.exists(clip_path):
        try: os.remove(clip_path)
        except Exception: pass

    temp_rec_dir = os.path.join(OUT_DIR, f"temp_{chapter_num:02d}")
    os.makedirs(temp_rec_dir, exist_ok=True)

    context = browser.new_context(
        viewport=VIEWPORT,
        device_scale_factor=2,
        record_video_dir=temp_rec_dir,
        record_video_size=VIEWPORT
    )
    
    print(f"\n🎬 Recording Chapter {chapter_num:02d}: {chapter_name}...", flush=True)
    task_func(context)
    
    context.close()
    
    # Locate recorded video
    files = [os.path.join(temp_rec_dir, f) for f in os.listdir(temp_rec_dir) if f.endswith(".webm")]
    if files:
        target = files[0]
        if os.path.exists(clip_path):
            os.remove(clip_path)
        os.rename(target, clip_path)
        print(f"  ✓ Saved {clip_path} ({os.path.getsize(clip_path):,} bytes)", flush=True)
    
    try: os.rmdir(temp_rec_dir)
    except Exception: pass

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--enable-font-antialiasing", "--font-render-hinting=medium"]
        )

        # -------------------------------------------------------------
        # Chapter 1: Opening & Landing Page
        # -------------------------------------------------------------
        def ch1(ctx):
            page = setup_page(ctx, "http://localhost:3000/")
            curr_x, curr_y = 720, 300
            page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
            time.sleep(1.2)
            
            # Hover over hero text
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 720, 220, steps=18)
            time.sleep(0.8)

            # Move to Start Analyzing button and click
            curr_x, curr_y = smooth_click(page, curr_x, curr_y, "a:has-text('Start Analyzing')")
            time.sleep(1.8)
        record_chapter(browser, 1, "opening", ch1)

        # -------------------------------------------------------------
        # Chapter 2: Workspace Dashboard
        # -------------------------------------------------------------
        def ch2(ctx):
            page = setup_page(ctx, "http://localhost:3000/app")
            page.wait_for_selector("text=Make sense of your data.", timeout=15000)
            curr_x, curr_y = 300, 200
            page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
            time.sleep(1.0)

            # Move cursor to Workspace Active badge in top navbar
            status_badge = page.locator("text=Workspace Active").first
            if status_badge.is_visible():
                box = status_badge.bounding_box()
                if box:
                    curr_x, curr_y = smooth_move(page, curr_x, curr_y, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=18)
                    time.sleep(0.8)

            # Move cursor to the Metric Cards: Datasets in Workspace, Records, Storage
            metric_card = page.locator("text=Datasets in Workspace").first
            if metric_card.is_visible():
                box = metric_card.bounding_box()
                if box:
                    curr_x, curr_y = smooth_move(page, curr_x, curr_y, box['x'] + box['width']/2, box['y'] + box['height']/2 + 20, steps=20)
                    time.sleep(0.8)

            # Move cursor to New Analysis link in navbar and click
            new_analysis_link = page.locator("a:has-text('New Analysis')").first
            if new_analysis_link.is_visible():
                curr_x, curr_y = smooth_click(page, curr_x, curr_y, "a:has-text('New Analysis')")
                time.sleep(1.5)
            else:
                time.sleep(1.5)
        record_chapter(browser, 2, "workspace", ch2)

        # -------------------------------------------------------------
        # Chapter 3: Upload & Dataset Overview
        # -------------------------------------------------------------
        def ch3(ctx):
            page = setup_page(ctx, "http://localhost:3000/app/upload")
            time.sleep(0.8)
            curr_x, curr_y = 720, 400
            page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
            
            # Move cursor to dropzone
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 720, 360, steps=20)
            page.evaluate(f"window.__triggerClickRipple({curr_x}, {curr_y})")
            
            # Set input file
            file_input = page.locator("input[type='file']").first
            file_input.set_input_files(ORDERS_CSV)
            
            page.wait_for_selector("button:has-text('Data Quality')", timeout=25000)
            time.sleep(1.0)

            # Move cursor over dataset metadata strip
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 450, 150, steps=20)
            time.sleep(1.0)

            # Smooth scroll to preview table
            smooth_scroll(page, 280, steps=15)
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 600, 480, steps=18)
            time.sleep(1.5)
        record_chapter(browser, 3, "upload_overview", ch3)

        # -------------------------------------------------------------
        # Chapter 4: Data Quality
        # -------------------------------------------------------------
        def ch4(ctx):
            page = setup_page(ctx, "http://localhost:3000/app/upload")
            page.wait_for_selector("button:has-text('Data Quality')", timeout=15000)
            curr_x, curr_y = 600, 200
            page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
            time.sleep(0.8)

            # Click Data Quality tab
            curr_x, curr_y = smooth_click(page, curr_x, curr_y, "button:has-text('Data Quality')")
            time.sleep(1.2)

            # Move cursor to 100% Quality Score card
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 350, 320, steps=22)
            time.sleep(1.2)

            # Move cursor to Column Health breakdown
            smooth_scroll(page, 200, steps=12)
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 700, 480, steps=18)
            time.sleep(1.5)
        record_chapter(browser, 4, "data_quality", ch4)

        # -------------------------------------------------------------
        # Chapter 5: Analytics
        # -------------------------------------------------------------
        def ch5(ctx):
            page = setup_page(ctx, "http://localhost:3000/app/upload")
            page.wait_for_selector("button:has-text('Analytics')", timeout=15000)
            curr_x, curr_y = 500, 180
            page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
            time.sleep(0.8)

            # Click Analytics tab
            curr_x, curr_y = smooth_click(page, curr_x, curr_y, "button:has-text('Analytics')")
            time.sleep(1.2)

            # Inspect descriptive stats table
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 500, 360, steps=20)
            time.sleep(1.2)

            # Scroll down to interactive charts
            smooth_scroll(page, 380, steps=16)
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 750, 460, steps=18)
            time.sleep(1.8)
        record_chapter(browser, 5, "analytics", ch5)

        # -------------------------------------------------------------
        # Chapter 6: AI Insights (Deterministic Rules)
        # -------------------------------------------------------------
        def ch6(ctx):
            page = setup_page(ctx, "http://localhost:3000/app/upload")
            page.wait_for_selector("button:has-text('AI Insights')", timeout=15000)
            curr_x, curr_y = 650, 180
            page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
            time.sleep(0.8)

            # Click AI Insights tab
            curr_x, curr_y = smooth_click(page, curr_x, curr_y, "button:has-text('AI Insights')")
            time.sleep(1.2)

            # Inspect deterministic observations deck
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 450, 340, steps=20)
            time.sleep(1.2)

            # Glide over insights cards
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 750, 380, steps=18)
            time.sleep(1.5)
        record_chapter(browser, 6, "ai_insights", ch6)

        # -------------------------------------------------------------
        # Chapter 7: SochIQ AI Assistant (Copilot Inquiries)
        # -------------------------------------------------------------
        def ch7(ctx):
            page = setup_page(ctx, "http://localhost:3000/app/upload")
            page.wait_for_selector("button:has-text('AI Insights')", timeout=15000)
            page.locator("button:has-text('AI Insights')").click()
            time.sleep(0.8)

            # Scroll down to spacious AI Assistant panel
            smooth_scroll(page, 520, steps=18)
            curr_x, curr_y = 720, 600
            page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
            time.sleep(1.0)

            # Click starter suggestion chip
            chip = page.locator("button:has-text('Which category generates the highest revenue?')").first
            if chip.is_visible():
                curr_x, curr_y = smooth_click(page, curr_x, curr_y, "button:has-text('Which category generates the highest revenue?')")
            else:
                # Type inquiry manually
                input_area = page.locator("textarea").first
                input_area.fill("Which category generates the highest revenue?")
                page.locator("button:has(svg)").last.click()

            # Wait for AI structured response to render
            page.wait_for_selector("text=Key Takeaways, text=Category", timeout=25000)
            time.sleep(1.0)

            # Scroll slightly to show structured table and insights
            smooth_scroll(page, 200, steps=12)
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 650, 450, steps=20)
            time.sleep(2.0)
        record_chapter(browser, 7, "ai_assistant", ch7)

        # -------------------------------------------------------------
        # Chapter 8: My Analyses
        # -------------------------------------------------------------
        def ch8(ctx):
            page = setup_page(ctx, "http://localhost:3000/app/analyses")
            page.wait_for_selector("h1:has-text('Workspace Datasets & Analyses')", timeout=15000)
            curr_x, curr_y = 300, 200
            page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
            time.sleep(1.0)

            # Click "Analysis History" tab
            hist_tab = page.locator("button:has-text('Analysis History')").first
            if hist_tab.is_visible():
                curr_x, curr_y = smooth_click(page, curr_x, curr_y, "button:has-text('Analysis History')")
                time.sleep(1.2)

            # Hover over first analysis run item
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 500, 320, steps=22)
            time.sleep(1.5)
        record_chapter(browser, 8, "my_analyses", ch8)

        # -------------------------------------------------------------
        # Chapter 9: Reports & PDF Export in Document Viewer
        # -------------------------------------------------------------
        def ch9(ctx):
            # Step 1: Show in-app Export PDF action
            page = setup_page(ctx, "http://localhost:3000/app/upload")
            page.wait_for_selector("button:has-text('Export PDF Report')", timeout=15000)
            curr_x, curr_y = 800, 200
            page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
            time.sleep(0.8)

            # Move to Export PDF Report button and click
            curr_x, curr_y = smooth_click(page, curr_x, curr_y, "button:has-text('Export PDF Report')")
            time.sleep(1.2)

            # Step 2: Navigate to Document Viewer showing the genuine generated PDF report
            page.goto("file:///" + VIEWER_HTML.replace("\\", "/"), wait_until="domcontentloaded")
            page.wait_for_selector("img", timeout=10000)
            page.evaluate(INJECT_CURSOR_JS)
            curr_x, curr_y = 720, 200
            page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
            time.sleep(1.0)

            # Glide cursor over KPI Scorecard (100% Quality, 20 Records, 7 Columns)
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 420, 290, steps=20)
            time.sleep(1.2)

            # Smooth vertical pan across the report: Schema table, stats, and insights
            smooth_scroll(page, 320, steps=20)
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 550, 420, steps=18)
            time.sleep(1.2)

            smooth_scroll(page, 300, steps=18)
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 600, 520, steps=18)
            time.sleep(1.5)
        record_chapter(browser, 9, "reports", ch9)

        # -------------------------------------------------------------
        # Chapter 10: Developer API Portal
        # -------------------------------------------------------------
        def ch10(ctx):
            page = setup_page(ctx, "http://localhost:3000/app/developer")
            page.wait_for_selector("text=Developer API", timeout=15000)
            curr_x, curr_y = 400, 200
            page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
            time.sleep(1.0)

            # Move to "Generate Temporary Key" button and click
            curr_x, curr_y = smooth_click(page, curr_x, curr_y, "button:has-text('Generate Temporary Key')")
            time.sleep(1.5)

            # Move cursor to the generated key token box
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 500, 320, steps=20)
            time.sleep(1.0)

            # Scroll to Python / cURL snippet
            smooth_scroll(page, 280, steps=14)
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 600, 480, steps=18)
            time.sleep(1.5)
        record_chapter(browser, 10, "developer_api", ch10)

        # -------------------------------------------------------------
        # Chapter 11: Closing Branding
        # -------------------------------------------------------------
        def ch11(ctx):
            page = setup_page(ctx, "http://localhost:3000/")
            curr_x, curr_y = 720, 400
            page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
            time.sleep(1.0)

            # Scroll to Hero badge
            curr_x, curr_y = smooth_move(page, curr_x, curr_y, 720, 200, steps=22)
            time.sleep(2.0)
        record_chapter(browser, 11, "closing", ch11)

        browser.close()
        print("\n🎉 ALL 11 CHAPTERS RECORDED WITH HIGH-RES CURSOR & RIPPLES!", flush=True)

if __name__ == "__main__":
    main()

