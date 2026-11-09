# SochIQ — Complete Product Walkthrough (Instagram Reel)

This directory contains the complete production pipeline, authentic screen recordings, motion graphics assets, report exports, and the final rendered video for **SochIQ**'s Instagram Reel showcase.

---

## 1. Video Technical Specifications

| Parameter | Specification | Verification |
| :--- | :--- | :---: |
| **Output File** | `SochIQ_Complete_Product_Walkthrough_Instagram.mp4` | **VERIFIED** |
| **Aspect Ratio** | Vertical 9:16 | **1080 × 1920** |
| **Frame Rate** | 30.000 FPS | **VERIFIED** |
| **Duration** | 54.30 Seconds (< 60s Instagram Reels specification) | **VERIFIED** |
| **Video Codec** | H.264 / AVC (High Profile, Level 4.0, YUV 4:2:0) | **VERIFIED** |
| **Audio Codec** | AAC-LC (192 kbps, 44.1 kHz, Stereo) | **VERIFIED** |
| **Audio Style** | Background ambient instrumental pad (`ambient_pad.wav`) | **VERIFIED** |
| **Voice-Over** | **STRICTLY ZERO** (No speech, dialogue, or narration) | **COMPLIED** |
| **Motion Graphics** | Animated SVG cursor with Bezier easing & yellow click ripples (`#FFDF00`) | **VERIFIED** |

---

## 2. The 11 Chapters Storyboard & Screen Coverage

| Chapter | Timecode | Screen & Route | Highlighted Features & Interactions |
| :---: | :---: | :--- | :--- |
| **01** | `00:00 - 00:05` | **Landing Page** (`/`) | Hero section ("Turn Your Data Into Smarter Decisions"), zero-registration pill, animated cursor gliding to "Start Analyzing" button with yellow click ripple. |
| **02** | `00:05 - 00:09` | **Workspace Dashboard** (`/app`) | `Workspace Active · Cloud Persisted` badge, 3-metric strip (Datasets, Records, Cloud Storage), cursor navigates to "New Analysis". |
| **03** | `00:09 - 00:15` | **Dataset Ingestion** (`/app/upload`) | Ingestion of `sample_ecommerce_orders.csv`, instant in-memory analysis pipeline, automated schema inference, 20 rows, 7 columns, and interactive preview grid. |
| **04** | `00:15 - 00:19` | **Data Quality Audit** | Tab transition to `Data Quality`, zoomed focus on **100% Health Score meter**, zero missing cells, zero duplicates, clean column badges. |
| **05** | `00:19 - 00:24` | **Analytics & Visualizations** | Tab transition to `Analytics`, descriptive statistics table (Mean, Median, Std Dev, Min, Max), interactive distribution and revenue charts. |
| **06** | `00:24 - 00:29` | **Rule-Based AI Insights** | Tab transition to `AI Insights`, deterministic heuristics deck highlighting revenue patterns, dominant categories, and mathematical observations. |
| **07** | `00:29 - 00:35` | **SochIQ AI Assistant** | Spacious AI Copilot interface, cursor clicks suggested prompt chip (*"Which category generates the highest revenue?"*), live Groq AI response with formatted tables and Key Takeaways cards. |
| **08** | `00:35 - 00:39` | **My Analyses History** (`/app/analyses`) | Sidebar navigation to `My Analyses`, inspection of cloud-persisted analysis run cards, timestamps, and parameters. |
| **09** | `00:39 - 00:46` | **Executive Reporting & PDF Viewer** | "Export PDF Report" action in app, transition to high-definition Document Viewer (`viewer.html`), smooth vertical pan across the complete ReportLab executive PDF (KPI scorecard, column audit, descriptive stats, rule insights). |
| **10** | `00:46 - 00:50` | **Developer REST API** (`/app/developer`) | Developer portal, cursor clicks "Generate Temporary API Key", generates live temporary key (`dl_live_...`), copy action, cURL & Python integration snippet. |
| **11** | `00:50 - 00:54` | **Closing Brand Lockup** | Minimalist SochIQ brand reveal: *"SOCHIQ — Your data. Better decisions."* |

---

## 3. Directory Structure

```
demo/
├── output/
│   ├── SochIQ_Complete_Product_Walkthrough_Instagram.mp4   # Final 1080x1920 Reel
│   └── chapters/                                          # 11 individual rendered scenes
│       ├── scene_01_opening.mp4
│       ├── scene_02_workspace.mp4
│       ├── ...
│       ├── scene_11_closing.mp4
│       └── concat_list.txt
├── raw_recordings/
│   ├── sochiq_master_raw.webm                             # 114s continuous master capture
│   └── chapters_metadata.json                             # Exact timestamps for all 11 chapters
├── report_pages/
│   ├── SochIQ_Report_sample_ecommerce_orders.pdf           # Genuine ReportLab PDF report
│   ├── report_page_1.png                                  # 300 DPI high-res rendered page
│   └── viewer.html                                        # Executive document viewer container
├── audio/
│   └── ambient_pad.wav                                    # Instrumental ambient background music
├── capture_master_walkthrough.py                          # Playwright browser recording automation
├── render_final_walkthrough.py                            # FFmpeg vertical compositor & audio mixer
└── sample_ecommerce_orders.csv                            # Demonstration dataset
```

---

## 4. How to Regenerate the Video

### Prerequisites
- Python 3.10+ with `playwright`, `pypdfium2`, `reportlab`, `pandas`
- FFmpeg 6.0+ installed and available in `PATH`
- FastAPI backend running on `http://localhost:8000`
- Next.js frontend running on `http://localhost:3000`

### Step 1: Capture the Screen Walkthrough
```bash
python demo/capture_master_walkthrough.py
```
This executes the automated Chromium session, injects the high-definition mouse cursor and click ripples, performs the authentic interactions across all 11 chapters, and outputs `demo/raw_recordings/sochiq_master_raw.webm` with `chapters_metadata.json`.

### Step 2: Render & Compose the Vertical Reel
```bash
python demo/render_final_walkthrough.py
```
This script trims each chapter, applies the 9:16 vertical canvas (`1080 × 1920`), renders the SochIQ yellow branding badges, headlines, window mockup frame, and bottom explainer cards, loops the ambient instrumental audio with fade-in/fade-out, and exports the final file to `demo/output/SochIQ_Complete_Product_Walkthrough_Instagram.mp4`.
