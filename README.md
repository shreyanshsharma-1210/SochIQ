# DataLens (Cloud 2.0)

**Upload your data. Understand it. Discover what matters.**

DataLens is a cloud-hosted, browser-based data analytics and developer platform with guaranteed **memory-only file processing** and zero raw dataset retention.

---

## 🌟 Key Features

- **Zero-Friction Anonymous Access:** Open and analyze datasets immediately via Supabase Anonymous Auth.
- **Privacy-First In-Memory Processing:** Ingests CSV, Excel (.xlsx), and JSON directly in ephemeral RAM (`io.BytesIO`). Zero raw records saved to disk or cloud storage.
- **Automated Data Quality Audit:** Detects missing cells, exact duplicate records, empty columns, and infers semantic types.
- **Visual Analytics:** Interactive Recharts (Bar charts, Line trends, Pie distributions, Histograms) in a warm, Diwali-inspired light aesthetic.
- **Deterministic Heuristic Insights:** Algorithmic observations on category dominance, variance, skew, and top performers without requiring AI.
- **Optional Groq Cloud AI:** Natural language inquiries and contextual summaries powered by Groq Llama-3 (analyzes aggregate statistics only; no raw data transmitted).
- **On-Demand Exports:** Instant ReportLab executive PDF reports and cleaned CSV streaming.
- **Developer REST API:** Complete versioned API (`/api/v1`) with automated Swagger / OpenAPI documentation.

---

## 🏗️ Architecture

```
User Browser
    │
    ▼ (HTTPS)
Next.js 14+ Frontend (Vercel)
    │
    ├─────────────────────────────┐
    ▼                             ▼
FastAPI Backend (Render)      Supabase (Auth & PostgreSQL)
    │                             │
    ├── In-Memory Pandas Engine   └── Row-Level Security (RLS)
    ├── ReportLab PDF Builder         Dataset Metadata Only
    └── Optional Groq AI Client
```

---

## 🚀 Quickstart (Local Development)

### 1. Backend (FastAPI)

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000/api/v1`
- Swagger UI: `http://localhost:8000/docs`

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

---

## 🧪 Testing

Run backend Pytest suite:
```bash
cd backend
python -m pytest
```

---

## 📄 License
MIT License.

