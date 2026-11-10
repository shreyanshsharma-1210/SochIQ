import os
import asyncio
from playwright.async_api import async_playwright
from PIL import Image

OUT_DIR = os.path.abspath("brand_assets")
FE_BRAND_DIR = os.path.abspath("frontend/public/brand")
BACKEND_STATIC = os.path.abspath("backend/app/static")

os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(FE_BRAND_DIR, exist_ok=True)
os.makedirs(BACKEND_STATIC, exist_ok=True)

# 1. Master Icon SVG (512x512 viewBox)
# Geometry scaled from 36x36 to 512x512 (scale factor: 512/36 = 14.22222)
ICON_SVG_CONTENT = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%" fill="none">
  <defs>
    <!-- Dark titanium luxury background gradient -->
    <linearGradient id="squircle_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1E22" />
      <stop offset="50%" stop-color="#141416" />
      <stop offset="100%" stop-color="#0A0A0C" />
    </linearGradient>

    <!-- Subtle luxury rim light border -->
    <linearGradient id="rim_light" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#404048" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#242428" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#18181A" stop-opacity="0.6" />
    </linearGradient>

    <!-- Yellow Glow Filter for Nodes -->
    <filter id="yellow_glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Center Intelligence Radial Pulse -->
    <radialGradient id="center_glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFDF00" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#FFDF00" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Squircle Base with 25% border-radius -->
  <rect x="8" y="8" width="496" height="496" rx="124" fill="url(#squircle_grad)" />
  <rect x="8" y="8" width="496" height="496" rx="124" stroke="url(#rim_light)" stroke-width="4" />

  <!-- Ambient Node Glow behind center nexus -->
  <circle cx="256" cy="270" r="90" fill="url(#center_glow)" />

  <!-- S-Curve Data Flow Path -->
  <!-- Scaled from M25 11C25 11 20 10 16 13C12 16 13 20 18 21C23 22 24 25 20 27C16 29 11 27 11 27 -->
  <path
    d="M 355.56 156.44
       C 355.56 156.44 284.44 142.22 227.56 184.89
       C 170.67 227.56 184.89 284.44 256.00 298.67
       C 327.11 312.89 341.33 355.56 284.44 384.00
       C 227.56 412.44 156.44 384.00 156.44 384.00"
    stroke="#FFFFFF"
    stroke-width="35.56"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Top Data Node (Yellow Spark) -->
  <circle cx="355.56" cy="156.44" r="39.11" fill="#FFDF00" filter="url(#yellow_glow)" />
  <circle cx="355.56" cy="156.44" r="16" fill="#FFFBE6" />

  <!-- Bottom Insight Node (Yellow Spark) -->
  <circle cx="156.44" cy="384.00" r="39.11" fill="#FFDF00" filter="url(#yellow_glow)" />
  <circle cx="156.44" cy="384.00" r="16" fill="#FFFBE6" />

  <!-- Center Intelligence Spark Dot -->
  <circle cx="256.00" cy="270.22" r="21.33" fill="#FFDF00" filter="url(#yellow_glow)" />
  <circle cx="256.00" cy="270.22" r="9" fill="#FFFBE6" />
</svg>"""

# 2. Transparent Glyphs only (No squircle background)
ICON_GLYPH_ONLY_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="100 100 312 312" width="100%" height="100%" fill="none">
  <defs>
    <filter id="yellow_glow_glyph" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <path
    d="M 355.56 156.44
       C 355.56 156.44 284.44 142.22 227.56 184.89
       C 170.67 227.56 184.89 284.44 256.00 298.67
       C 327.11 312.89 341.33 355.56 284.44 384.00
       C 227.56 412.44 156.44 384.00 156.44 384.00"
    stroke="#FFFFFF"
    stroke-width="35.56"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <circle cx="355.56" cy="156.44" r="39.11" fill="#FFDF00" filter="url(#yellow_glow_glyph)" />
  <circle cx="355.56" cy="156.44" r="16" fill="#FFFBE6" />

  <circle cx="156.44" cy="384.00" r="39.11" fill="#FFDF00" filter="url(#yellow_glow_glyph)" />
  <circle cx="156.44" cy="384.00" r="16" fill="#FFFBE6" />

  <circle cx="256.00" cy="270.22" r="21.33" fill="#FFDF00" filter="url(#yellow_glow_glyph)" />
  <circle cx="256.00" cy="270.22" r="9" fill="#FFFBE6" />
</svg>"""

# 3. Horizontal Brand Lockup (SVG with embedded Google Font Sora)
def make_horizontal_svg(theme="light"):
    text_color = "#111111" if theme == "light" else "#FFFFFF"
    sub_color = "#666666" if theme == "light" else "#999999"
    badge_bg = "#FFF9D2" if theme == "light" else "#2A2A1A"
    badge_text = "#8A7500" if theme == "light" else "#FFDF00"

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 480" width="100%" height="100%" fill="none">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&amp;display=swap');
      .brand-title {{
        font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
        font-weight: 800;
        font-size: 190px;
        letter-spacing: -6px;
      }}
      .brand-sub {{
        font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
        font-weight: 600;
        font-size: 40px;
        letter-spacing: 2px;
        text-transform: uppercase;
      }}
    </style>
    <linearGradient id="squircle_grad_h" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1E22" />
      <stop offset="50%" stop-color="#141416" />
      <stop offset="100%" stop-color="#0A0A0C" />
    </linearGradient>
    <linearGradient id="rim_light_h" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#404048" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#242428" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#18181A" stop-opacity="0.6" />
    </linearGradient>
    <filter id="yellow_glow_h" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Icon Group (Scaled to 340x340 placed at x=70, y=70) -->
  <g transform="translate(70, 70)">
    <rect width="340" height="340" rx="85" fill="url(#squircle_grad_h)" />
    <rect width="340" height="340" rx="85" stroke="url(#rim_light_h)" stroke-width="3" />
    
    <!-- Path inside 340 box (scale = 340/512 = 0.6640625) -->
    <g transform="scale(0.6640625)">
      <path
        d="M 355.56 156.44
           C 355.56 156.44 284.44 142.22 227.56 184.89
           C 170.67 227.56 184.89 284.44 256.00 298.67
           C 327.11 312.89 341.33 355.56 284.44 384.00
           C 227.56 412.44 156.44 384.00 156.44 384.00"
        stroke="#FFFFFF"
        stroke-width="36"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle cx="355.56" cy="156.44" r="39.11" fill="#FFDF00" filter="url(#yellow_glow_h)" />
      <circle cx="355.56" cy="156.44" r="16" fill="#FFFBE6" />
      <circle cx="156.44" cy="384.00" r="39.11" fill="#FFDF00" filter="url(#yellow_glow_h)" />
      <circle cx="156.44" cy="384.00" r="16" fill="#FFFBE6" />
      <circle cx="256.00" cy="270.22" r="21.33" fill="#FFDF00" filter="url(#yellow_glow_h)" />
      <circle cx="256.00" cy="270.22" r="9" fill="#FFFBE6" />
    </g>
  </g>

  <!-- Typography: SochIQ -->
  <text x="470" y="295" class="brand-title" fill="{text_color}">Soch<tspan fill="#FFDF00">IQ</tspan></text>

  <!-- Subtitle Badge -->
  <rect x="474" y="330" width="370" height="52" rx="14" fill="{badge_bg}" />
  <text x="496" y="367" class="brand-sub" fill="{badge_text}">DATA INTELLIGENCE</text>
</svg>"""


# Save all Vector SVG files
with open(os.path.join(OUT_DIR, "sochiq_icon.svg"), "w", encoding="utf-8") as f:
    f.write(ICON_SVG_CONTENT)
with open(os.path.join(OUT_DIR, "sochiq_icon_glyph.svg"), "w", encoding="utf-8") as f:
    f.write(ICON_GLYPH_ONLY_SVG)
with open(os.path.join(OUT_DIR, "sochiq_logo_horizontal_light.svg"), "w", encoding="utf-8") as f:
    f.write(make_horizontal_svg("light"))
with open(os.path.join(OUT_DIR, "sochiq_logo_horizontal_dark.svg"), "w", encoding="utf-8") as f:
    f.write(make_horizontal_svg("dark"))

# Also copy to frontend/public/brand
with open(os.path.join(FE_BRAND_DIR, "sochiq_icon.svg"), "w", encoding="utf-8") as f:
    f.write(ICON_SVG_CONTENT)
with open(os.path.join(FE_BRAND_DIR, "sochiq_logo_light.svg"), "w", encoding="utf-8") as f:
    f.write(make_horizontal_svg("light"))
with open(os.path.join(FE_BRAND_DIR, "sochiq_logo_dark.svg"), "w", encoding="utf-8") as f:
    f.write(make_horizontal_svg("dark"))

print("✅ Saved all Vector SVG files.")

async def render_high_res_pngs():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        # 1. Render Icon at 512, 1024, 2048, 4096 px (with transparent background)
        for size in [512, 1024, 2048, 4096]:
            page = await browser.new_page(viewport={"width": size, "height": size}, device_scale_factor=1)
            html = f"""<!DOCTYPE html>
            <html>
            <head><style>body,html{{margin:0;padding:0;background:transparent;overflow:hidden;}}</style></head>
            <body>{ICON_SVG_CONTENT}</body>
            </html>"""
            await page.set_content(html)
            out_file = os.path.join(OUT_DIR, f"sochiq_icon_{size}x{size}.png")
            await page.screenshot(path=out_file, omit_background=True)
            print(f"✅ Rendered {out_file}")

            # Also update backend static and frontend brand
            if size == 1024:
                await page.screenshot(path=os.path.join(BACKEND_STATIC, "sochiq_logo.png"), omit_background=True)
                await page.screenshot(path=os.path.join(FE_BRAND_DIR, "sochiq_icon_1024.png"), omit_background=True)
                print(f"✅ Updated backend PDF logo: {os.path.join(BACKEND_STATIC, 'sochiq_logo.png')}")

        # 2. Render Horizontal Logos (Light & Dark) at 4000x1200 px (300 DPI Ultra Sharp)
        for theme in ["light", "dark"]:
            page = await browser.new_page(viewport={"width": 4000, "height": 1200}, device_scale_factor=1)
            svg_code = make_horizontal_svg(theme)
            html = f"""<!DOCTYPE html>
            <html>
            <head>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap" rel="stylesheet">
              <style>
                body, html {{ margin: 0; padding: 0; background: transparent; overflow: hidden; }}
                svg {{ width: 100vw; height: 100vh; }}
              </style>
            </head>
            <body>{svg_code}</body>
            </html>"""
            await page.set_content(html)
            # Wait for Google Font to be completely loaded
            await page.wait_for_timeout(1000)
            out_file = os.path.join(OUT_DIR, f"sochiq_logo_horizontal_{theme}_4000x1200.png")
            await page.screenshot(path=out_file, omit_background=True)
            await page.screenshot(path=os.path.join(FE_BRAND_DIR, f"sochiq_logo_horizontal_{theme}.png"), omit_background=True)
            print(f"✅ Rendered {out_file}")

        # 3. Studio Mockup Presentation Badge (App Store / Showcase Style with Soft Shadow on Cream #FAFAF8)
        page = await browser.new_page(viewport={"width": 2048, "height": 2048}, device_scale_factor=1)
        mockup_html = f"""<!DOCTYPE html>
        <html>
        <head>
          <style>
            body, html {{
              margin: 0;
              padding: 0;
              width: 100vw;
              height: 100vh;
              background-color: #FAFAF8;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: -apple-system, sans-serif;
            }}
            .icon-card {{
              width: 1024px;
              height: 1024px;
              border-radius: 256px;
              box-shadow: 
                0 40px 100px -20px rgba(0, 0, 0, 0.35),
                0 20px 40px -10px rgba(0, 0, 0, 0.20),
                0 0 0 1px rgba(0,0,0,0.06);
            }}
          </style>
        </head>
        <body>
          <div class="icon-card">
            {ICON_SVG_CONTENT}
          </div>
        </body>
        </html>"""
        await page.set_content(mockup_html)
        out_mockup = os.path.join(OUT_DIR, "sochiq_app_icon_mockup_2048x2048.png")
        await page.screenshot(path=out_mockup)
        print(f"✅ Rendered Studio Mockup: {out_mockup}")

        await browser.close()

asyncio.run(render_high_res_pngs())
print("🎉 All High Quality Brand Assets Successfully Created!")

