import os
import subprocess

DEMO_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(DEMO_DIR, "raw_recordings")
AUDIO_DIR = os.path.join(DEMO_DIR, "audio")
OUT_DIR = os.path.join(DEMO_DIR, "output")
os.makedirs(OUT_DIR, exist_ok=True)

FINAL_OUTPUT = os.path.join(OUT_DIR, "sochiq_reel_9x16.mp4")
MIXED_AUDIO = os.path.join(AUDIO_DIR, "mixed_audio.wav")

FONT_BOLD = "C\\:/Windows/Fonts/segoeuib.ttf"
FONT_REG = "C\\:/Windows/Fonts/segoeui.ttf"

SCENES = [
    {
        "clip": os.path.join(RAW_DIR, "clip1_landing.mp4"),
        "duration": 7.0,
        "tag": "AI DATA INTELLIGENCE",
        "title": "Think Smarter. See Deeper.",
        "subtitle": "Turn raw business data into executive clarity.",
        "caption": "Meet SochIQ — a modern data workspace built for instant analytics.",
        "badge": "ZERO REGISTRATION REQUIRED"
    },
    {
        "clip": os.path.join(RAW_DIR, "clip2_dashboard.mp4"),
        "duration": 7.5,
        "tag": "BROWSER WORKSPACE",
        "title": "Zero Setup. Complete Privacy.",
        "subtitle": "Encrypted temporary cloud with 30-minute auto-cleanup.",
        "caption": "Jump straight in with temporary cloud persistence and automatic cleanup.",
        "badge": "30-MINUTE EXPIRATION PURGE"
    },
    {
        "clip": os.path.join(RAW_DIR, "clip3_quality.mp4"),
        "duration": 10.0,
        "tag": "AUTOMATED AUDIT",
        "title": "Instant Data Quality Scoring",
        "subtitle": "Automated schema inference, null counts, and audits.",
        "caption": "Drop any CSV, Excel, or JSON. Audited in-memory in seconds.",
        "badge": "100 PERCENT HEALTH SCORE"
    },
    {
        "clip": os.path.join(RAW_DIR, "clip4_analytics.mp4"),
        "duration": 8.0,
        "tag": "DEEP ANALYTICS",
        "title": "Statistical Spreads and Insights",
        "subtitle": "Comprehensive descriptive stats and rule-based AI findings.",
        "caption": "Explore descriptive statistics, distributions, and actionable insights.",
        "badge": "MULTI-TABLE SWITCHING"
    },
]

def render_scene(idx, scene):
    out_scene = os.path.join(RAW_DIR, f"scene_{idx}.mp4")
    dur = scene["duration"]
    tag = scene["tag"]
    title = scene["title"]
    subtitle = scene["subtitle"]
    caption = scene["caption"]
    badge = scene["badge"]

    # Complex filter constructing 9:16 frame with centered window mockup
    filter_complex = (
        # 1. Base dark canvas 1080x1920
        f"color=c=0x0D0D11:s=1080x1920:d={dur}[base]; "
        # 2. Window mockup header bar
        f"color=c=0x1E1E24:s=980x44:d={dur}[win_bar]; "
        # 3. macOS style window buttons on bar
        f"[win_bar]drawbox=x=16:y=16:w=12:h=12:color=0xFF5F56@1:t=fill,"
        f"drawbox=x=36:y=16:w=12:h=12:color=0xFFBD2E@1:t=fill,"
        f"drawbox=x=56:y=16:w=12:h=12:color=0x27C93F@1:t=fill,"
        f"drawtext=fontfile='{FONT_REG}':text='sochiq.app/workspace':fontsize=15:fontcolor=0x888899:x=(980-tw)/2:y=(44-th)/2[win_bar_styled]; "
        # 4. Scale and crop video clip into window body 980x612
        f"[0:v]scale=980:612:force_original_aspect_ratio=decrease,pad=980:612:(ow-iw)/2:(oh-ih)/2:color=0x111111[clip_scaled]; "
        # 5. Stack bar on top of clip
        f"[win_bar_styled][clip_scaled]vstack[win_full]; "
        # 6. Add subtle border around window
        f"[win_full]drawbox=x=0:y=0:w=iw:h=ih:color=0x2E2E38@1:t=2[win_bordered]; "
        # 7. Composite window onto base at y=490
        f"[base][win_bordered]overlay=x=50:y=490[comp1]; "
        # 8. Top Branding Pill
        f"[comp1]drawbox=x=50:y=140:w=260:h=36:color=0xFFDF00@1:t=fill,"
        f"drawtext=fontfile='{FONT_BOLD}':text='{tag}':fontsize=14:fontcolor=0x111111:x=68:y=150,"
        # 9. Top Main Headline
        f"drawtext=fontfile='{FONT_BOLD}':text='{title}':fontsize=44:fontcolor=white:x=50:y=200,"
        # 10. Top Subtitle
        f"drawtext=fontfile='{FONT_REG}':text='{subtitle}':fontsize=22:fontcolor=0xA0A0B0:x=50:y=265,"
        # 11. Bottom Highlight Badge Pill
        f"drawbox=x=50:y=1220:w=360:h=38:color=0x1A1A22@1:t=fill,"
        f"drawbox=x=50:y=1220:w=360:h=38:color=0x333344@1:t=1,"
        f"drawtext=fontfile='{FONT_BOLD}':text='{badge}':fontsize=13:fontcolor=0xFFDF00:x=68:y=1232,"
        # 12. Bottom Dynamic Caption Card
        f"drawbox=x=50:y=1280:w=980:h=120:color=0x16161E@1:t=fill,"
        f"drawbox=x=50:y=1280:w=6:h=120:color=0xFFDF00@1:t=fill,"
        f"drawbox=x=50:y=1280:w=980:h=120:color=0x2A2A38@1:t=1,"
        f"drawtext=fontfile='{FONT_BOLD}':text='{caption}':fontsize=24:fontcolor=white:x=80:y=1325[vfinal]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-t", str(dur),
        "-i", scene["clip"],
        "-filter_complex", filter_complex,
        "-map", "[vfinal]",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        out_scene
    ]
    print(f"Rendering Scene {idx}...")
    subprocess.run(cmd, check=True)
    return out_scene

def render_outro():
    out_outro = os.path.join(RAW_DIR, "scene_outro.mp4")
    dur = 3.8
    filter_complex = (
        f"color=c=0x0D0D11:s=1080x1920:d={dur}[base]; "
        # Center glow card
        f"[base]drawbox=x=140:y=620:w=800:h=600:color=0x16161E@1:t=fill,"
        f"drawbox=x=140:y=620:w=800:h=600:color=0xFFDF00@1:t=2,"
        # Logo badge
        f"drawbox=x=470:y=680:w=140:h=60:color=0xFFDF00@1:t=fill,"
        f"drawtext=fontfile='{FONT_BOLD}':text='SOCH IQ':fontsize=24:fontcolor=0x111111:x=490:y=698,"
        # Outro text
        f"drawtext=fontfile='{FONT_BOLD}':text='Think Smarter. See Deeper.':fontsize=42:fontcolor=white:x=(1080-tw)/2:y=790,"
        f"drawtext=fontfile='{FONT_REG}':text='An intelligent workspace for confident data decisions.':fontsize=22:fontcolor=0xA0A0B0:x=(1080-tw)/2:y=850,"
        f"drawbox=x=390:y=940:w=300:h=56:color=0xFFDF00@1:t=fill,"
        f"drawtext=fontfile='{FONT_BOLD}':text='TRY SOCHIQ NOW':fontsize=18:fontcolor=0x111111:x=440:y=958,"
        f"drawtext=fontfile='{FONT_REG}':text='Next.js • FastAPI • Supabase Cloud':fontsize=18:fontcolor=0x666677:x=(1080-tw)/2:y=1080[vfinal]"
    )
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"color=c=black:s=1080x1920:d={dur}",
        "-filter_complex", filter_complex,
        "-map", "[vfinal]",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        out_outro
    ]
    print("Rendering Outro Scene...")
    subprocess.run(cmd, check=True)
    return out_outro

def assemble_final(rendered_scenes):
    concat_list = os.path.join(RAW_DIR, "concat.txt")
    with open(concat_list, "w", encoding="utf-8") as f:
        for s in rendered_scenes:
            f.write(f"file '{os.path.basename(s)}'\n")

    temp_video = os.path.join(RAW_DIR, "video_merged.mp4")

    # 1. Concat video clips
    cmd_concat = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list,
        "-c", "copy",
        temp_video
    ]
    print("Concatenating video scenes...")
    subprocess.run(cmd_concat, check=True)

    # 2. Multiplex with mixed narration + ambient audio
    cmd_final = [
        "ffmpeg", "-y",
        "-i", temp_video,
        "-i", MIXED_AUDIO,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        FINAL_OUTPUT
    ]
    print("Muxing final video with audio track...")
    subprocess.run(cmd_final, check=True)
    print(f"🎉 Final 9:16 Cinematic Video exported to:\n   {FINAL_OUTPUT}")

if __name__ == "__main__":
    rendered = []
    for i, sc in enumerate(SCENES, 1):
        rendered.append(render_scene(i, sc))
    rendered.append(render_outro())
    assemble_final(rendered)
