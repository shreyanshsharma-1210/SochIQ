# DataLens Technical Architecture Specification

**Product:** DataLens (Cloud Architecture 2.0)  
**Target:** Cloud-Hosted 3-Tier Web Application  
**Deployment:** Vercel (Frontend) + Render (FastAPI Backend) + Supabase (PostgreSQL & Anonymous Auth) + Groq Cloud (Optional AI)

---

## 1. High-Level System Architecture

DataLens delivers instant in-memory dataset analytics, automated data-quality audits, and executive PDF reporting with guaranteed **zero-retention raw file privacy**.

```
User Web Browser
    │
    │  HTTPS (REST & JSON)
    ▼
Next.js 14+ App Router (Vercel)
    │
    ├─────────────────────────────────────────┐
    │ Bearer JWT (Anonymous Session)          │ Direct RLS Reads (Optional)
    ▼                                         ▼
FastAPI Application Layer (Render)        Supabase PostgreSQL
    │                                         ▲
    ├── In-Memory BytesIO Ingestion Engine    │ (Metadata & Analysis History Only)
    ├── Pandas & NumPy Analytics Core         │
    ├── ReportLab In-Memory PDF Generator     │
    └── Optional Groq AI Client (Llama-3) ────┘
```

---

## 2. In-Memory Processing & Privacy Guarantee

1. **Ephemeral RAM Ingestion:** Uploaded files stream directly into Python `io.BytesIO`. Files are never written to host disks or object storage.
2. **Payload Protection:** 
   - 25 MB strict memory threshold per request (`MAX_UPLOAD_SIZE_MB`).
   - Magic bytes and MIME verification for CSV, XLSX, and JSON.
   - Decompression-bomb limits on Excel packages.
3. **Immediate Memory Reclamation:** File buffers and Pandas dataframes are explicitly deallocated and garbage-collected upon request cycle completion.
4. **Metadata-Only Persistence:** If the user saves a dataset profile, only high-level schema summaries (column names, types, null percentages, total counts) are saved to Supabase PostgreSQL under their anonymous user UUID.

---

## 3. Database Architecture & Row-Level Security

All tables reside in **Supabase PostgreSQL** with Row-Level Security (RLS) enabled:

### Table: `public.dataset_metadata`
Stores sanitized dataset schema profiles. No raw rows.
- `id` (UUID, Primary Key)
- `owner_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
- `name` (VARCHAR)
- `original_filename` (VARCHAR)
- `file_format` (VARCHAR: `csv`, `xlsx`, `json`)
- `row_count` (INTEGER)
- `column_count` (INTEGER)
- `column_summary` (JSONB: column names, types, missing rates)
- `created_at` (TIMESTAMPTZ)

### Table: `public.analysis_history`
Stores historical query parameters and aggregated summary snapshots.
- `id` (UUID, Primary Key)
- `owner_id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
- `dataset_id` (UUID, references `dataset_metadata(id)` ON DELETE CASCADE)
- `analysis_type` (VARCHAR)
- `parameters` (JSONB)
- `result_summary` (JSONB)
- `created_at` (TIMESTAMPTZ)

### RLS Policies
```sql
CREATE POLICY "Users access own metadata" ON public.dataset_metadata
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users access own analysis" ON public.analysis_history
    FOR ALL USING (auth.uid() = owner_id);
```

---

## 4. Visual Design System (Diwali Light Palette)

The frontend implements a warm, radiant, and accessible data-centric theme:

| Token | Hex Code | Visual Application |
|---|---|---|
| `background` | `#FFFDF8` | Warm ivory canvas |
| `surface` | `#FFFFFF` | Cards, tables, modal dialogs |
| `primary` | `#9B681E` | Primary action buttons, active navigation markers |
| `gold` | `#C99A3A` | KPI borders, highlight badges, icons |
| `saffron` | `#E9A23B` | Callout alerts, dropzone hover glow |
| `maroon` | `#713B36` | Critical quality alerts, deletion triggers |
| `text` | `#28251F` | High-contrast headers and body text |
| `text-muted` | `#817B70` | Secondary metadata and helper text |
| `border` | `#EEE7D9` | Card outlines and table row dividers |

**Typography:**
- Display / Headings: `Playfair Display` (serif)
- Interface / Figures: `DM Sans` with `tabular-nums`

