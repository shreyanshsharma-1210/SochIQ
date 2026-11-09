import os
import time
import json
from playwright.sync_api import sync_playwright

WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(WORKSPACE_DIR, "raw_recordings")
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

def inject(page):
    try:
        page.evaluate(INJECT_CURSOR_JS)
    except Exception:
        pass

def smooth_move(page, start_x, start_y, end_x, end_y, steps=20, delay=0.015):
    for i in range(1, steps + 1):
        t = i / steps
        ease = t * t * (3.0 - 2.0 * t)
        curr_x = start_x + (end_x - start_x) * ease
        curr_y = start_y + (end_y - start_y) * ease
        try:
            page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
        except Exception:
            pass
        time.sleep(delay)
    return end_x, end_y

def smooth_click(page, curr_x, curr_y, target, steps=18):
    loc = page.locator(target).first if isinstance(target, str) else target
    box = loc.bounding_box()
    if box:
        target_x = box['x'] + box['width'] / 2
        target_y = box['y'] + box['height'] / 2
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, target_x, target_y, steps)
        try:
            page.evaluate(f"window.__triggerClickRipple({target_x}, {target_y})")
        except Exception:
            pass
        time.sleep(0.12)
        loc.click()
        time.sleep(0.3)
    return curr_x, curr_y

def smooth_scroll(page, delta_y, steps=14, delay=0.02):
    for i in range(steps):
        step_scroll = delta_y / steps
        page.evaluate(f"window.scrollBy(0, {step_scroll})")
        time.sleep(delay)

def main():
    print("🚀 Initializing authentic continuous video capture...", flush=True)
    temp_rec_dir = os.path.join(OUT_DIR, "temp_master")
    os.makedirs(temp_rec_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--enable-font-antialiasing", "--font-render-hinting=medium"]
        )

        context = browser.new_context(
            viewport=VIEWPORT,
            device_scale_factor=2,
            record_video_dir=temp_rec_dir,
            record_video_size=VIEWPORT
        )

        page = context.new_page()
        page.on("load", lambda: inject(page))

        chapters = []
        t0 = time.perf_counter()

        def mark_chapter(num, name, tag, title, subtitle, badge, caption):
            elapsed = time.perf_counter() - t0
            chapters.append({
                "chapter": num,
                "name": name,
                "start_time": elapsed,
                "tag": tag,
                "title": title,
                "subtitle": subtitle,
                "badge": badge,
                "caption": caption
            })
            print(f"\n📍 [{elapsed:.2f}s] Chapter {num}: {title}", flush=True)

        # Clear any prior session state for authentic fresh start
        context.clear_cookies()

        # -----------------------------------------------------------------
        # Chapter 1: Opening & Landing Page
        # -----------------------------------------------------------------
        mark_chapter(
            1, "opening", "MEET SOCHIQ",
            "Meet SochIQ", "Turn datasets into insights in seconds.",
            "ZERO REGISTRATION REQUIRED",
            "A temporary, privacy-first analytics cloud workspace."
        )
        page.goto("http://localhost:3000/", wait_until="domcontentloaded")
        page.wait_for_selector("text=Turn Your Data", timeout=15000)
        inject(page)
        curr_x, curr_y = 720, 300
        page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
        time.sleep(1.0)
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 720, 220, steps=16)
        time.sleep(0.8)
        curr_x, curr_y = smooth_click(page, curr_x, curr_y, "a:has-text('Start Analyzing')")
        time.sleep(1.8)

        # -----------------------------------------------------------------
        # Chapter 2: Workspace Dashboard
        # -----------------------------------------------------------------
        mark_chapter(
            2, "workspace", "BROWSER WORKSPACE",
            "Your Analytics Workspace", "Encrypted cloud workspace with automatic persistence.",
            "CLOUD PERSISTED · 30M GRACE PERIOD",
            "Upload multiple datasets and switch seamlessly."
        )
        page.wait_for_selector("text=Make sense of your data.", timeout=15000)
        inject(page)
        time.sleep(0.8)
        
        # Hover over Workspace Active pill
        status_badge = page.locator("text=Workspace Active").first
        if status_badge.is_visible():
            box = status_badge.bounding_box()
            if box:
                curr_x, curr_y = smooth_move(page, curr_x, curr_y, box['x'] + box['width']/2, box['y'] + box['height']/2, steps=18)
                time.sleep(0.8)

        # Hover over Workspace stats
        metric_card = page.locator("text=Datasets in Workspace").first
        if metric_card.is_visible():
            box = metric_card.bounding_box()
            if box:
                curr_x, curr_y = smooth_move(page, curr_x, curr_y, box['x'] + box['width']/2, box['y'] + box['height']/2 + 20, steps=18)
                time.sleep(0.8)

        # Click New Analysis
        curr_x, curr_y = smooth_click(page, curr_x, curr_y, "a:has-text('New Analysis')")
        time.sleep(1.2)

        # -----------------------------------------------------------------
        # Chapter 3: Upload & Dataset Overview
        # -----------------------------------------------------------------
        mark_chapter(
            3, "upload_overview", "INSTANT INGESTION",
            "Upload. Explore. Understand.", "Instant in-memory profiling for CSV, Excel & JSON.",
            "AUTOMATED SCHEMA INFERENCE",
            "Inspect schema, column types, and live data preview."
        )
        # Wait for file input to attach to DOM
        file_input = page.locator("input[type='file']").first
        file_input.wait_for(state="attached", timeout=15000)
        inject(page)
        time.sleep(0.6)

        # Move to dropzone and upload
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 720, 360, steps=18)
        page.evaluate(f"window.__triggerClickRipple({curr_x}, {curr_y})")
        
        file_input.set_input_files(ORDERS_CSV)
        print("  ✓ Uploaded orders CSV, awaiting analysis...", flush=True)

        page.locator("button:has-text('Data Quality')").first.wait_for(timeout=25000)
        inject(page)
        print("  ✓ Analysis rendered! Tabs ready.", flush=True)
        time.sleep(1.0)

        # Inspect dataset metadata
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 420, 160, steps=18)
        time.sleep(0.8)
        smooth_scroll(page, 260, steps=14)
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 620, 460, steps=16)
        time.sleep(1.5)

        # -----------------------------------------------------------------
        # Chapter 4: Data Quality Audit
        # -----------------------------------------------------------------
        mark_chapter(
            4, "data_quality", "DATA INTEGRITY",
            "Understand Your Data Quality", "Automated health score, null checks & duplicate audits.",
            "100% HEALTH SCORE CONFIRMED",
            "Instant detection of null values, anomalies, and type mismatches."
        )
        smooth_scroll(page, -260, steps=12)
        curr_x, curr_y = smooth_click(page, curr_x, curr_y, "button:has-text('Data Quality')")
        time.sleep(1.0)

        # Zoom in on 100% Health Score
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 350, 330, steps=20)
        time.sleep(1.0)
        smooth_scroll(page, 180, steps=12)
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 720, 480, steps=16)
        time.sleep(1.5)

        # -----------------------------------------------------------------
        # Chapter 5: Analytics & Distributions
        # -----------------------------------------------------------------
        mark_chapter(
            5, "analytics", "DEEP ANALYTICS",
            "Discover Patterns in Your Data", "Descriptive stats, distributions & correlation insights.",
            "INTERACTIVE VISUALIZATIONS",
            "Explore statistical spreads and dynamic breakdown charts."
        )
        smooth_scroll(page, -180, steps=12)
        curr_x, curr_y = smooth_click(page, curr_x, curr_y, "button:has-text('Analytics')")
        time.sleep(1.0)

        # Inspect stats
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 500, 360, steps=18)
        time.sleep(1.0)

        # Scroll down to charts
        smooth_scroll(page, 360, steps=16)
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 740, 460, steps=16)
        time.sleep(1.8)

        # -----------------------------------------------------------------
        # Chapter 6: AI Insights (Deterministic Rules)
        # -----------------------------------------------------------------
        mark_chapter(
            6, "ai_insights", "RULE-BASED INTELLIGENCE",
            "Find Meaningful Insights", "Deterministic analytical observations & trend detection.",
            "HEURISTIC PATTERN ENGINE",
            "Automated findings grounded directly on mathematical metrics."
        )
        smooth_scroll(page, -360, steps=14)
        curr_x, curr_y = smooth_click(page, curr_x, curr_y, "button:has-text('AI Insights')")
        time.sleep(1.0)

        # Highlight rule insights
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 450, 340, steps=18)
        time.sleep(1.0)
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 750, 380, steps=16)
        time.sleep(1.4)

        # -----------------------------------------------------------------
        # Chapter 7: SochIQ AI Assistant
        # -----------------------------------------------------------------
        mark_chapter(
            7, "ai_assistant", "AI COPILOT",
            "Ask Questions. Explore Insights.", "Natural language inquiries with tables, charts & takeaways.",
            "PRIVACY-PRESERVING AI",
            "Sends only computed metrics. Zero raw data transmitted."
        )
        # Scroll to AI Assistant
        smooth_scroll(page, 480, steps=16)
        time.sleep(0.8)
        
        # Click suggestion chip
        chip = page.locator("button:has-text('Which category generates the highest revenue?')").first
        if chip.is_visible():
            curr_x, curr_y = smooth_click(page, curr_x, curr_y, chip)
        else:
            first_chip = page.locator("button:has-text('revenue'), button:has-text('Summarize'), button:has-text('variance')").first
            if first_chip.is_visible():
                curr_x, curr_y = smooth_click(page, curr_x, curr_y, first_chip)

        # Await real Groq AI response
        time.sleep(3.5)
        smooth_scroll(page, 220, steps=14)
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 650, 480, steps=18)
        time.sleep(2.0)

        # -----------------------------------------------------------------
        # Chapter 8: My Analyses
        # -----------------------------------------------------------------
        mark_chapter(
            8, "my_analyses", "ANALYSIS HISTORY",
            "Your Work, Ready to Revisit", "Historical analysis runs stored securely in your workspace.",
            "PERSISTENT RUN HISTORY",
            "Revisit previous analytical queries and profile runs anytime."
        )
        curr_x, curr_y = smooth_click(page, curr_x, curr_y, "a:has-text('My Analyses')")
        page.wait_for_selector("h1:has-text('My Analyses')", timeout=15000)
        inject(page)
        time.sleep(1.0)

        # Switch to history tab
        hist_tab = page.locator("button:has-text('Analysis History')").first
        if hist_tab.is_visible():
            curr_x, curr_y = smooth_click(page, curr_x, curr_y, "button:has-text('Analysis History')")
            time.sleep(1.0)

        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 520, 340, steps=18)
        time.sleep(1.5)

        # -----------------------------------------------------------------
        # Chapter 9: Reports & PDF Export in Document Viewer
        # -----------------------------------------------------------------
        mark_chapter(
            9, "reports", "EXECUTIVE REPORTING",
            "From Analysis to Report", "Full executive PDF reports generated directly in-memory.",
            "PUBLICATION-READY PDF",
            "Complete with KPI scorecard, schema audit, and statistical tables."
        )
        # Navigate to Upload to click Export PDF
        page.goto("http://localhost:3000/app/upload", wait_until="domcontentloaded")
        inject(page)
        page.wait_for_selector("button:has-text('Export PDF Report')", timeout=15000)
        time.sleep(0.8)
        curr_x, curr_y = smooth_click(page, curr_x, curr_y, "button:has-text('Export PDF Report')")
        time.sleep(1.0)

        # Open Document Viewer
        page.goto("file:///" + VIEWER_HTML.replace("\\", "/"), wait_until="domcontentloaded")
        page.wait_for_selector("img", timeout=10000)
        inject(page)
        curr_x, curr_y = 720, 200
        page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
        time.sleep(1.0)

        # Pan across KPI Scorecard
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 420, 290, steps=18)
        time.sleep(1.0)

        # Smooth vertical scroll across Schema table, stats, and insights
        smooth_scroll(page, 300, steps=18)
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 550, 420, steps=16)
        time.sleep(1.0)

        smooth_scroll(page, 280, steps=16)
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 600, 520, steps=16)
        time.sleep(1.5)

        # -----------------------------------------------------------------
        # Chapter 10: Developer API Portal
        # -----------------------------------------------------------------
        mark_chapter(
            10, "developer_api", "DEVELOPER PLATFORM",
            "Analytics for Developers", "Programmatic dataset ingestion, analysis & report export.",
            "INSTANT TEMPORARY API KEYS",
            "Integrate SochIQ directly into pipelines via REST endpoints."
        )
        page.goto("http://localhost:3000/app/developer", wait_until="domcontentloaded")
        inject(page)
        page.wait_for_selector("text=Developer API", timeout=15000)
        time.sleep(0.8)

        # Click Generate Temporary API Key
        curr_x, curr_y = smooth_click(page, curr_x, curr_y, "button:has-text('Generate Temporary API Key')")
        time.sleep(1.2)

        # Hover over generated token
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 500, 320, steps=18)
        time.sleep(1.0)
        smooth_scroll(page, 260, steps=14)
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 600, 480, steps=16)
        time.sleep(1.5)

        # -----------------------------------------------------------------
        # Chapter 11: Closing Branding
        # -----------------------------------------------------------------
        mark_chapter(
            11, "closing", "SOCHIQ",
            "SOCHIQ", "Your data. Better decisions.",
            "TRY SOCHIQ TODAY",
            "Zero registration required • Open your workspace now."
        )
        page.goto("http://localhost:3000/", wait_until="domcontentloaded")
        page.wait_for_selector("text=Turn Your Data", timeout=15000)
        inject(page)
        curr_x, curr_y = 720, 380
        page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
        time.sleep(1.0)
        curr_x, curr_y = smooth_move(page, curr_x, curr_y, 720, 220, steps=20)
        time.sleep(2.5)

        # Save metadata
        total_time = time.perf_counter() - t0
        for i in range(len(chapters)):
            next_start = chapters[i+1]["start_time"] if i + 1 < len(chapters) else total_time
            chapters[i]["end_time"] = next_start
            chapters[i]["duration"] = next_start - chapters[i]["start_time"]

        meta_path = os.path.join(OUT_DIR, "chapters_metadata.json")
        with open(meta_path, "w") as f:
            json.dump({"total_duration": total_time, "chapters": chapters}, f, indent=2)
        print(f"\n📊 Saved chapters metadata to: {meta_path} (Total: {total_time:.2f}s)", flush=True)

        context.close()
        browser.close()

    # Move raw master recording to known location
    files = [os.path.join(temp_rec_dir, f) for f in os.listdir(temp_rec_dir) if f.endswith(".webm")]
    if files:
        target = os.path.join(OUT_DIR, "sochiq_master_raw.webm")
        if os.path.exists(target):
            try: os.remove(target)
            except Exception: pass
        os.rename(files[0], target)
        print(f"🎬 Successfully saved master video: {target} ({os.path.getsize(target):,} bytes)", flush=True)

    try: os.rmdir(temp_rec_dir)
    except Exception: pass

if __name__ == "__main__":
    main()
