import os
import time
from playwright.sync_api import sync_playwright

OUT_DIR = r"demo\raw_recordings\test"
os.makedirs(OUT_DIR, exist_ok=True)

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
        transform: translate(200px, 200px);
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
            border: 3px solid #FFDF00;
            background: rgba(255, 223, 0, 0.4);
            pointer-events: none;
            z-index: 2147483646;
            transform: scale(0.3);
            opacity: 1;
            transition: transform 0.4s cubic-bezier(0.15, 0.85, 0.35, 1.2), opacity 0.4s ease-out;
            box-shadow: 0 0 12px rgba(255, 223, 0, 0.6);
        `;
        document.body.appendChild(ripple);
        requestAnimationFrame(() => {
            ripple.style.transform = 'scale(1.8)';
            ripple.style.opacity = '0';
        });
        setTimeout(() => ripple.remove(), 450);
    };
})();
"""

def smooth_move(page, start_x, start_y, end_x, end_y, steps=25, delay=0.015):
    for i in range(1, steps + 1):
        t = i / steps
        # Smooth cubic easeInOut curve
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
        time.sleep(0.15)
        loc.click()
        time.sleep(0.2)
    return curr_x, curr_y

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
            record_video_dir=OUT_DIR,
            record_video_size={"width": 1440, "height": 900}
        )
        page = context.new_page()
        page.goto("http://localhost:3000/", wait_until="domcontentloaded")
        page.wait_for_selector("text=Think smarter.", timeout=15000)
        page.evaluate(INJECT_CURSOR_JS)

        curr_x, curr_y = 400, 300
        page.evaluate(f"window.__setCursorPos({curr_x}, {curr_y})")
        time.sleep(0.5)

        # Move to Launch Workspace button
        curr_x, curr_y = smooth_click(page, curr_x, curr_y, "a:has-text('Launch Workspace')")
        page.screenshot(path=os.path.join(OUT_DIR, "cursor_ripple_test.png"))
        time.sleep(1.0)

        context.close()
        browser.close()
        print("Cursor test completed successfully!")

if __name__ == "__main__":
    run_test()
