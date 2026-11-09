# DataLens REST API Specification (v1)

**Base URL:** `http://localhost:8000/api/v1` (Local) / `https://<render-host>/api/v1` (Cloud)  
**Interactive Docs:** `/docs` (Swagger UI) / `/redoc` (ReDoc)  
**Authentication:** `Authorization: Bearer <SUPABASE_ANON_JWT>` (Optional in dev, required in production)

---

## 1. Service Health

### `GET /health`
Returns system operational state, active processing mode, and connected provider availability.

**Response `200 OK`:**
```json
{
  "status": "ok",
  "service": "DataLens",
  "version": "2.0.0",
  "mode": "memory-only",
  "groq_available": false,
  "supabase_connected": false
}
```

---

## 2. In-Memory Datasets & Profiling

### `POST /datasets/preview`
Uploads and evaluates CSV, Excel (.xlsx), or JSON files in memory. Returns schema metadata, bounded preview rows, and a complete data-quality audit.

**Request:** `multipart/form-data`
- `file`: Binary file upload (max 25 MB)

**Response `200 OK`:**
```json
{
  "filename": "sample_sales.csv",
  "file_format": "csv",
  "row_count": 1015,
  "column_count": 9,
  "columns": ["transaction_id", "date", "category", "product", "revenue"],
  "inferred_types": {
    "transaction_id": "string",
    "date": "datetime",
    "revenue": "numeric"
  },
  "preview_rows": [
    { "transaction_id": "TXN-10000", "date": "2025-01-01", "revenue": 1420.5 }
  ],
  "quality": {
    "total_rows": 1015,
    "total_columns": 9,
    "missing_cells": 51,
    "missing_percentage": 0.56,
    "duplicate_rows": 15,
    "duplicate_percentage": 1.48,
    "empty_columns": 0,
    "cleanliness_score": 98.8,
    "column_audits": [
      {
        "name": "revenue",
        "inferred_type": "numeric",
        "missing_count": 0,
        "missing_percentage": 0.0,
        "unique_count": 940,
        "is_empty": false
      }
    ]
  }
}
```

**Errors:**
- `413 Payload Too Large`: File exceeds 25 MB.
- `415 Unsupported Media Type`: Non-supported file extension.
- `422 Unprocessable Entity`: Corrupted or empty file.

---

## 3. Analytics & Charts

### `POST /analytics/summary`
Calculates comprehensive descriptive statistics across all numeric, categorical, and temporal columns in memory.

**Response `200 OK`:**
```json
{
  "row_count": 1015,
  "column_count": 9,
  "numeric_columns": {
    "revenue": {
      "count": 1015,
      "mean": 1284.15,
      "median": 980.20,
      "std": 1012.44,
      "min": 15.0,
      "max": 4890.0,
      "q25": 450.0,
      "q75": 1890.0,
      "iqr": 1440.0,
      "skew": 1.34
    }
  },
  "categorical_columns": {
    "category": {
      "count": 1015,
      "unique_count": 5,
      "top_values": [
        { "label": "Electronics", "count": 355, "percentage": 35.0 }
      ]
    }
  },
  "temporal_columns": {
    "date": {
      "count": 1015,
      "min_date": "2025-01-01",
      "max_date": "2025-12-31",
      "duration_days": 364.0,
      "periodic_counts": { "2025-01": 85 }
    }
  }
}
```

### `POST /analytics/chart-data`
Generates structured series formatted directly for Recharts (Bar, Line, Pie, Histogram).

---

## 4. Deterministic Insights & Optional AI

### `POST /insights/rules`
Non-AI deterministic observations on data quality, skew, dominant categories, and top performers.

### `POST /ai/query`
Sends natural language questions to Groq Cloud API grounded **strictly on aggregate summary context**. Zero raw data transmitted.

---

## 5. Exports

### `POST /exports/pdf`
Renders an executive summary report PDF using ReportLab with the custom Diwali theme.

**Headers:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename=DataLens_Report_<filename>.pdf`

### `POST /exports/csv`
Purges duplicates, standardizes headers, and streams a clean CSV export.

**Headers:**
- `Content-Type: text/csv; charset=utf-8`

