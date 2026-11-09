import os
import json
import subprocess

DEMO_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_MASTER = os.path.join(DEMO_DIR, "raw_recordings", "sochiq_master_raw.webm")
AUDIO_FILE = os.path.join(DEMO_DIR, "audio", "ambient_pad.wav")
CH_DIR = os.path.join(DEMO_DIR, "output", "chapters")
OUT_DIR = os.path.join(DEMO_DIR, "output")
os.makedirs(CH_DIR, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)

FINAL_OUTPUT = os.path.join(OUT_DIR, "SochIQ_Complete_Product_Walkthrough_Instagram.mp4")

FONT_BOLD = "C\\:/Windows/Fonts/segoeuib.ttf"
FONT_REG = "C\\:/Windows/Fonts/segoeui.ttf"

# Storyboard definitions for all 11 chapters
CHAPTERS = [
    {
        "idx": 1,
        "name": "opening",
        "ss": 0.5,
        "dur": 4.8,
        "crop_scale": "scale=1568:980:flags=lanczos,crop=980:980:(in_w-980)/2:0",
        "tag": "CHAPTER 01 • WELCOME",
        "title": "Meet SochIQ",
        "subtitle": "Turn datasets into insights in seconds",
        "badge": "● ZERO REGISTRATION REQUIRED",
        "card_title": "Instant Cloud Analytics Workspace",
        "card_desc": "A temporary\\, privacy-first analytics cloud workspace."
    },
    {
        "idx": 2,
        "name": "workspace",
        "ss": 8.0,
        "dur": 4.5,
        "crop_scale": "scale=1568:980:flags=lanczos,crop=980:980:(in_w-980)/2:0",
        "tag": "CHAPTER 02 • WORKSPACE",
        "title": "Your Analytics Workspace",
        "subtitle": "Encrypted cloud workspace with automatic persistence",
        "badge": "● CLOUD PERSISTED · 30M GRACE PERIOD",
        "card_title": "Multi-Dataset Persistence & History",
        "card_desc": "Upload multiple datasets and switch seamlessly."
    },
    {
        "idx": 3,
        "name": "upload_overview",
        "ss": 15.0,
        "dur": 5.2,
        "crop_scale": "scale=1568:980:flags=lanczos,crop=980:980:(in_w-980)/2:60",
        "tag": "CHAPTER 03 • INGESTION",
        "title": "Upload. Explore. Understand.",
        "subtitle": "Instant in-memory profiling for CSV, Excel & JSON",
        "badge": "● AUTOMATED SCHEMA INFERENCE",
        "card_title": "Live Ingestion & Data Preview",
        "card_desc": "Inspect schema\\, column types\\, and live data preview."
    },
    {
        "idx": 4,
        "name": "data_quality",
        "ss": 28.8,
        "dur": 4.8,
        "crop_scale": "scale=1680:1050:flags=lanczos,crop=980:980:(in_w-980)/2:100",
        "tag": "CHAPTER 04 • DATA QUALITY",
        "title": "Understand Your Data Quality",
        "subtitle": "Automated health score, null checks & duplicate audits",
        "badge": "● 100 PERCENT HEALTH SCORE",
        "card_title": "Automated Data Quality Audit",
        "card_desc": "Instant detection of null values\\, anomalies & type mismatches."
    },
    {
        "idx": 5,
        "name": "analytics",
        "ss": 40.2,
        "dur": 5.0,
        "crop_scale": "scale=1620:1012:flags=lanczos,crop=980:980:(in_w-980)/2:120",
        "tag": "CHAPTER 05 • ANALYTICS",
        "title": "Discover Patterns in Your Data",
        "subtitle": "Descriptive stats, distributions & correlation insights",
        "badge": "● INTERACTIVE VISUALIZATIONS",
        "card_title": "Statistical Spreads & Distributions",
        "card_desc": "Explore statistical spreads and dynamic breakdown charts."
    },
    {
        "idx": 6,
        "name": "ai_insights",
        "ss": 52.4,
        "dur": 4.5,
        "crop_scale": "scale=1580:988:flags=lanczos,crop=980:980:(in_w-980)/2:90",
        "tag": "CHAPTER 06 • AI INSIGHTS",
        "title": "Find Meaningful Insights",
        "subtitle": "Deterministic analytical observations & trend detection",
        "badge": "● HEURISTIC PATTERN ENGINE",
        "card_title": "Deterministic Analytical Rules",
        "card_desc": "Automated findings grounded directly on mathematical metrics."
    },
    {
        "idx": 7,
        "name": "ai_assistant",
        "ss": 62.5,
        "dur": 5.8,
        "crop_scale": "scale=1620:1012:flags=lanczos,crop=980:980:(in_w-980)/2:180",
        "tag": "CHAPTER 07 • AI COPILOT",
        "title": "Ask Questions. Explore Insights.",
        "subtitle": "Natural language inquiries with tables, charts & takeaways",
        "badge": "● PRIVACY-PRESERVING AI",
        "card_title": "Conversational Data Intelligence",
        "card_desc": "Sends only computed metrics. Zero raw data transmitted."
    },
    {
        "idx": 8,
        "name": "my_analyses",
        "ss": 74.8,
        "dur": 4.5,
        "crop_scale": "scale=1568:980:flags=lanczos,crop=980:980:(in_w-980)/2:70",
        "tag": "CHAPTER 08 • ANALYSIS HISTORY",
        "title": "Your Work, Ready to Revisit",
        "subtitle": "Historical analysis runs stored securely in your workspace",
        "badge": "● PERSISTENT RUN HISTORY",
        "card_title": "Complete Analysis Audit Trail",
        "card_desc": "Revisit previous analytical queries and profile runs anytime."
    },
    {
        "idx": 9,
        "name": "reports",
        "ss": 82.5,
        "dur": 6.2,
        "crop_scale": "scale=1568:980:flags=lanczos,crop=980:980:(in_w-980)/2:40",
        "tag": "CHAPTER 09 • EXECUTIVE REPORTS",
        "title": "From Analysis to Report",
        "subtitle": "Full executive PDF reports generated directly in-memory",
        "badge": "● PUBLICATION-READY PDF",
        "card_title": "Executive PDF Generation",
        "card_desc": "Complete with KPI scorecard\\, schema audit\\, and statistical tables."
    },
    {
        "idx": 10,
        "name": "developer_api",
        "ss": 98.2,
        "dur": 4.8,
        "crop_scale": "scale=1580:988:flags=lanczos,crop=980:980:(in_w-980)/2:80",
        "tag": "CHAPTER 10 • DEVELOPER PLATFORM",
        "title": "Analytics for Developers",
        "subtitle": "Programmatic dataset ingestion, analysis & report export",
        "badge": "● INSTANT TEMPORARY API KEYS",
        "card_title": "Full REST API Automation",
        "card_desc": "Integrate SochIQ directly into pipelines via REST endpoints."
    },
    {
        "idx": 11,
        "name": "closing",
        "ss": 109.8,
        "dur": 4.2,
        "crop_scale": "scale=1568:980:flags=lanczos,crop=980:980:(in_w-980)/2:0",
        "tag": "CHAPTER 11 • SOCHIQ",
        "title": "SOCHIQ",
        "subtitle": "Your data. Better decisions.",
        "badge": "● TRY SOCHIQ TODAY",
        "card_title": "Start Analyzing in Seconds",
        "card_desc": "Zero registration required • Open your workspace now."
    }
]

def escape_drawtext(s: str) -> str:
    s = s.replace("\\,", ",").replace("\\:", ":")
    s = s.replace("%", "%%")
    s = s.replace(":", "\\:")
    s = s.replace(",", "\\,")
    return s

def render_chapter(ch):
    idx = ch["idx"]
    name = ch["name"]
    ss = ch["ss"]
    dur = ch["dur"]
    crop_scale = ch["crop_scale"]
    tag = escape_drawtext(ch["tag"])
    title = escape_drawtext(ch["title"])
    subtitle = escape_drawtext(ch["subtitle"])
    badge = escape_drawtext(ch["badge"])
    card_title = escape_drawtext(ch["card_title"])
    card_desc = escape_drawtext(ch["card_desc"])

    out_file = os.path.join(CH_DIR, f"scene_{idx:02d}_{name}.mp4")
    print(f"Rendering Chapter {idx:02d}: {title} ({dur}s)...", flush=True)

    filter_complex = (
        f"color=c=0x0B0B0F:s=1080x1920:d={dur}:r=30[base]; "
        f"color=c=0x1A1A22:s=980x44:d={dur}:r=30[win_bar]; "
        f"[win_bar]drawbox=x=16:y=16:w=12:h=12:color=0xFF5F56@1:t=fill,"
        f"drawbox=x=36:y=16:w=12:h=12:color=0xFFBD2E@1:t=fill,"
        f"drawbox=x=56:y=16:w=12:h=12:color=0x27C93F@1:t=fill,"
        f"drawtext=fontfile='{FONT_REG}':text='sochiq.app/workspace':fontsize=14:fontcolor=0x888899:x=(980-tw)/2:y=(44-th)/2[win_bar_styled]; "
        f"[0:v]{crop_scale}[clip_scaled]; "
        f"[win_bar_styled][clip_scaled]vstack[win_full]; "
        f"[win_full]drawbox=x=0:y=0:w=iw:h=ih:color=0x2E2E38@1:t=2[win_bordered]; "
        f"[base][win_bordered]overlay=x=50:y=400[comp1]; "
        # Top Badge Pill (SochIQ Bright Yellow)
        f"[comp1]drawbox=x=50:y=120:w=290:h=36:color=0xFFDF00@1:t=fill,"
        f"drawtext=fontfile='{FONT_BOLD}':text='{tag}':fontsize=13:fontcolor=0x111111:x=68:y=132,"
        # Top Main Headline
        f"drawtext=fontfile='{FONT_BOLD}':text='{title}':fontsize=46:fontcolor=white:x=50:y=180,"
        # Top Subtitle
        f"drawtext=fontfile='{FONT_REG}':text='{subtitle}':fontsize=21:fontcolor=0x9E9EB0:x=50:y=245,"
        # Bottom Feature Highlight Pill
        f"drawbox=x=50:y=1460:w=380:h=38:color=0x161620@1:t=fill,"
        f"drawbox=x=50:y=1460:w=380:h=38:color=0x303040@1:t=1,"
        f"drawtext=fontfile='{FONT_BOLD}':text='{badge}':fontsize=13:fontcolor=0xFFDF00:x=68:y=1472,"
        # Bottom Narrative Explainer Card
        f"drawbox=x=50:y=1515:w=980:h=130:color=0x13131A@1:t=fill,"
        f"drawbox=x=50:y=1515:w=6:h=130:color=0xFFDF00@1:t=fill,"
        f"drawbox=x=50:y=1515:w=980:h=130:color=0x262634@1:t=1,"
        f"drawtext=fontfile='{FONT_BOLD}':text='{card_title}':fontsize=22:fontcolor=white:x=80:y=1545,"
        f"drawtext=fontfile='{FONT_REG}':text='{card_desc}':fontsize=17:fontcolor=0x9999AA:x=80:y=1585[vfinal]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(ss),
        "-t", str(dur),
        "-i", RAW_MASTER,
        "-filter_complex", filter_complex,
        "-map", "[vfinal]",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        out_file
    ]
    subprocess.run(cmd, check=True)
    print(f"  ✓ Chapter {idx:02d} rendered ({os.path.getsize(out_file):,} bytes)", flush=True)
    return out_file

def main():
    print("🎬 Starting complete rendering of all 11 chapters...", flush=True)
    scene_files = []
    total_duration = 0.0
    for ch in CHAPTERS:
        scene_path = render_chapter(ch)
        scene_files.append(scene_path)
        total_duration += ch["dur"]

    print(f"\nAll {len(scene_files)} chapters rendered! Total duration: {total_duration:.2f}s", flush=True)

    # Build concat file
    concat_list_path = os.path.join(CH_DIR, "concat_list.txt")
    with open(concat_list_path, "w") as f:
        for sf in scene_files:
            # Escape path for FFmpeg concat demuxer
            safe_path = sf.replace("\\", "/")
            f.write(f"file '{safe_path}'\n")

    # Final video concat + audio mix (loop ambient_pad with fade-in/fade-out, ZERO voice-over)
    print("🎵 Mixing final vertical video with ambient instrumental background track...", flush=True)
    cmd_final = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_path,
        "-stream_loop", "-1",
        "-i", AUDIO_FILE,
        "-filter_complex",
        (
            f"[1:a]atrim=0:{total_duration},"
            f"afade=t=in:ss=0:d=1.5,"
            f"afade=t=out:st={total_duration - 2.0}:d=2.0,"
            f"volume=0.75[audio_out]"
        ),
        "-map", "0:v",
        "-map", "[audio_out]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        FINAL_OUTPUT
    ]
    subprocess.run(cmd_final, check=True)
    print(f"\n🎉 FINAL PRODUCT DEMO REEL EXPORTED SUCCESSFULLY!", flush=True)
    print(f"📁 Destination: {FINAL_OUTPUT}")
    print(f"📦 Size: {os.path.getsize(FINAL_OUTPUT):,} bytes")
    print(f"⏱️ Duration: {total_duration:.2f} seconds | 1080x1920 | 30 FPS | MP4 H.264")

if __name__ == "__main__":
    main()

