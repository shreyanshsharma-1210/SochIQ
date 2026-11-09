import os
import subprocess

DEMO_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_MASTER = os.path.join(DEMO_DIR, "raw_recordings", "sochiq_master_raw.webm")
TEST_OUT = os.path.join(DEMO_DIR, "output", "test_ch1.mp4")
os.makedirs(os.path.join(DEMO_DIR, "output"), exist_ok=True)

FONT_BOLD = "C\\:/Windows/Fonts/segoeuib.ttf"
FONT_REG = "C\\:/Windows/Fonts/segoeui.ttf"

# Test Chapter 1 (0.0 to 5.0s)
cmd = [
    "ffmpeg", "-y",
    "-ss", "0.0",
    "-t", "5.0",
    "-i", RAW_MASTER,
    "-filter_complex",
    (
        # 1. Base dark canvas 1080x1920
        "color=c=0x0B0B0F:s=1080x1920:d=5.0:r=30[base]; "
        # 2. Window bar 980x44
        "color=c=0x1A1A22:s=980x44:d=5.0:r=30[win_bar]; "
        "[win_bar]drawbox=x=16:y=16:w=12:h=12:color=0xFF5F56@1:t=fill,"
        "drawbox=x=36:y=16:w=12:h=12:color=0xFFBD2E@1:t=fill,"
        "drawbox=x=56:y=16:w=12:h=12:color=0x27C93F@1:t=fill,"
        f"drawtext=fontfile='{FONT_REG}':text='sochiq.app/workspace':fontsize=14:fontcolor=0x888899:x=(980-tw)/2:y=(44-th)/2[win_bar_styled]; "
        # 3. Scale and crop video into window body 980x980
        "[0:v]scale=1568:980:flags=lanczos,crop=980:980:(in_w-980)/2:0[clip_scaled]; "
        # 4. Stack bar on clip
        "[win_bar_styled][clip_scaled]vstack[win_full]; "
        # 5. Add border
        "[win_full]drawbox=x=0:y=0:w=iw:h=ih:color=0x2E2E38@1:t=2[win_bordered]; "
        # 6. Composite onto base at y=400
        "[base][win_bordered]overlay=x=50:y=400[comp1]; "
        # 7. Top Chapter Tag Pill (SochIQ Yellow)
        "[comp1]drawbox=x=50:y=120:w=260:h=36:color=0xFFDF00@1:t=fill,"
        f"drawtext=fontfile='{FONT_BOLD}':text='CHAPTER 01 • WELCOME':fontsize=13:fontcolor=0x111111:x=68:y=132,"
        # 8. Top Headline
        f"drawtext=fontfile='{FONT_BOLD}':text='Meet SochIQ':fontsize=48:fontcolor=white:x=50:y=180,"
        # 9. Top Subtitle
        f"drawtext=fontfile='{FONT_REG}':text='Turn datasets into insights in seconds':fontsize=22:fontcolor=0xA0A0B0:x=50:y=245,"
        # 10. Bottom Highlight Badge Pill
        "drawbox=x=50:y=1460:w=360:h=38:color=0x161620@1:t=fill,"
        "drawbox=x=50:y=1460:w=360:h=38:color=0x303040@1:t=1,"
        f"drawtext=fontfile='{FONT_BOLD}':text='● ZERO REGISTRATION REQUIRED':fontsize=13:fontcolor=0xFFDF00:x=68:y=1472,"
        # 11. Bottom Explainer Card
        "drawbox=x=50:y=1515:w=980:h=130:color=0x13131A@1:t=fill,"
        "drawbox=x=50:y=1515:w=6:h=130:color=0xFFDF00@1:t=fill,"
        "drawbox=x=50:y=1515:w=980:h=130:color=0x262634@1:t=1,"
        f"drawtext=fontfile='{FONT_BOLD}':text='Instant Cloud Analytics Workspace':fontsize=22:fontcolor=white:x=80:y=1545,"
        f"drawtext=fontfile='{FONT_REG}':text='A temporary\\, privacy-first analytics cloud workspace.':fontsize=17:fontcolor=0x9999AA:x=80:y=1585[vfinal]"
    ),
    "-map", "[vfinal]",
    "-c:v", "libx264",
    "-preset", "fast",
    "-pix_fmt", "yuv420p",
    TEST_OUT
]

print("Executing test FFmpeg render...")
subprocess.run(cmd, check=True)
print(f"✓ Rendered: {TEST_OUT} ({os.path.getsize(TEST_OUT):,} bytes)")

# Extract 1 frame to verify image visually
frame_out = os.path.join(DEMO_DIR, "output", "test_ch1_frame.png")
subprocess.run(["ffmpeg", "-y", "-ss", "00:00:02", "-i", TEST_OUT, "-vframes", "1", frame_out], check=True)
print(f"✓ Extracted frame: {frame_out}")

