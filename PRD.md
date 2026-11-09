# DataLens
## Product Requirements Document (PRD) & Technical Architecture

**Version:** 1.0  
**Product:** DataLens  
**Project:** Project 01 — 60-Day AI Engineer Journey  
**Document Status:** MVP Specification  
**Architecture:** Local-first, modular monolith  
**Primary Interface:** Web application  
**Target Users:** Individuals, students, analysts, developers and small businesses

---

# 1. Product Overview

## 1.1 Product Description

DataLens is a local-first data analytics platform that enables users to upload structured datasets, inspect data quality, generate analytical summaries, visualize information and access analytical results through REST APIs.

The platform provides two primary experiences:

1. **Analytics Workspace:** A visual interface for uploading, inspecting and understanding datasets.
2. **Developer Interface:** REST API endpoints that allow external applications to retrieve dataset metadata and analytical results.

Both experiences use the same Python-based data processing and analytics engine.

## 1.2 Product Vision

Make structured data easier to understand, explore and integrate into applications without requiring users to write data-processing scripts.

## 1.3 Product Value Proposition

**Upload your data. Understand it. Use it anywhere.**

DataLens transforms raw CSV, Excel and JSON files into structured information and accessible analytical results.

## 1.4 Product Principles

- Simple and intuitive user experience.
- Accurate and reproducible calculations.
- Transparent data-quality reporting.
- Local-first processing and storage.
- Reusable backend architecture.
- API-first integration capabilities.
- No unnecessary AI features in the initial release.

---

# 2. Locked Product Decisions

| Decision | Final Selection |
|---|---|
| Product direction | Analytics platform + Developer API |
| Target audience | Individuals + Businesses + Developers |
| Authentication | None |
| Storage | Local filesystem |
| Metadata database | SQLite |
| Supported formats | CSV, XLSX, JSON |
| Frontend | Next.js + TypeScript |
| Backend | Python + FastAPI |
| Data processing | Pandas |
| Query engine | SQLite |
| Validation | Pydantic |
| Visualization | Recharts |
| Product theme | Light-based Diwali theme |
| Deployment target | Local development initially |

## 2.1 Authentication and Security Boundary

The MVP does not include user registration, login, user sessions or API-key management.

The application is intended to run locally for its initial release.

Security requirements:

- Bind the backend to localhost by default.
- Do not expose unauthenticated upload endpoints to the public internet.
- Validate uploaded file extensions, MIME types and file content.
- Generate internal dataset identifiers.
- Prevent path traversal and arbitrary filesystem access.
- Restrict SQL execution to read-only queries if SQL exploration is introduced later.
- Set configurable upload and processing limits.

A future public deployment must introduce authentication, authorization, rate limiting and appropriate storage isolation.

---

# 3. User Personas

## Persona A — Individual Data Explorer

**Profile:** Student, researcher or analyst.

**Needs:**
- Inspect CSV or Excel files.
- Understand missing values and duplicate records.
- View summary statistics.
- Generate charts without writing code.
- Export analytical reports.

## Persona B — Small Business Analyst

**Profile:** Small business owner or operations analyst.

**Needs:**
- Understand sales or inventory datasets.
- Identify top-performing categories.
- Calculate totals and averages.
- Compare performance.
- Share analytical outputs.

## Persona C — Developer

**Profile:** Backend or full-stack developer.

**Needs:**
- Upload datasets.
- Retrieve metadata programmatically.
- Retrieve analytical summaries through REST APIs.
- Integrate results into other applications.
- Understand API contracts through Swagger documentation.

---

# 4. Product Scope

DataLens is divided into six functional modules.

## 4.1 Module A — Workspace Dashboard

**Priority:** P0 — MVP

The dashboard is the main landing page.

Features:

- Application overview.
- Total datasets processed.
- Total records analyzed.
- Recent datasets.
- Quick upload action.
- Recent processing status.
- Navigation to analytics and developer documentation.

Dashboard statistics must be calculated from actual stored metadata, not hardcoded values.

## 4.2 Module B — Dataset Management

**Priority:** P0 — MVP

Users can import and manage datasets.

Supported formats:

| Format | Extension | Processing Library |
|---|---|---|
| CSV | .csv | Pandas |
| Excel | .xlsx | Pandas + openpyxl |
| JSON | .json | Python JSON + Pandas |

MVP requirements:

- Drag-and-drop file upload.
- File picker upload.
- File extension validation.
- File size validation.
- Dataset name.
- Upload timestamp.
- File size.
- Processing status.
- Dataset preview.
- Dataset deletion.
- Dataset listing.

JSON support should initially cover:
- JSON arrays of objects.
- Records-oriented JSON.
- Standard object structures that can be normalized into tabular data.

Unsupported or ambiguous JSON structures must produce a useful error rather than silently losing information.

Initial configurable upload limit: 25 MB.

## 4.3 Module C — Dataset Explorer

**Priority:** P0 — MVP

Provides a detailed overview of an uploaded dataset.

### Dataset Overview

Display:
- Dataset name.
- Source file format.
- Total rows.
- Total columns.
- Processing timestamp.
- Dataset identifier.

### Data Preview

- Tabular data preview.
- Column headers.
- Data types.
- Pagination.
- Null value display.

### Data Quality Analysis

Detect:
- Missing values.
- Duplicate rows.
- Empty columns.
- Inferred data types.
- Columns with inconsistent values where detectable.

### Data Quality Report

Example:

| Metric | Example |
|---|---:|
| Total rows | 10,000 |
| Total columns | 8 |
| Missing values | 125 |
| Duplicate rows | 12 |
| Empty columns | 1 |

Do not invent a quality score without defining its calculation. If a score is introduced, document the formula and make the underlying metrics visible.

## 4.4 Module D — Analytics Studio

**Priority:** P0 — MVP

Generates useful descriptive analytics from uploaded datasets.

### Descriptive Statistics

For numeric columns:
- Count.
- Mean.
- Median.
- Standard deviation.
- Minimum.
- Maximum.
- Quartiles.

For categorical columns:
- Unique value count.
- Most frequent values.
- Value frequencies.

For date columns:
- Earliest date.
- Latest date.
- Supported time-based grouping.

### Aggregations

- Sum.
- Average.
- Minimum.
- Maximum.
- Count.
- Group by selected columns.

### Visualization

Initial chart types:
- Bar chart.
- Line chart.
- Pie chart.
- Data distribution chart.

Charts must use actual analytical results.

### Automated Insights

Rule-based insights for the MVP:

- Highest-value category.
- Lowest-value category.
- Highest-frequency category.
- Top-performing record where a meaningful metric exists.
- Numeric column distribution summaries.
- Potential data-quality concerns.

These are deterministic analytical insights, not AI-generated recommendations.

## 4.5 Module E — Developer API

**Priority:** P0 — MVP

Expose dataset information and analytical results through FastAPI.

### Initial API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health | Health check |
| GET | /api/datasets | List datasets |
| POST | /api/datasets/upload | Upload dataset |
| GET | /api/datasets/{id} | Dataset metadata |
| GET | /api/datasets/{id}/preview | Preview records |
| GET | /api/datasets/{id}/quality | Data quality report |
| GET | /api/datasets/{id}/analytics | Analytical summary |
| DELETE | /api/datasets/{id} | Delete dataset |

### API Response Principles

- Consistent JSON structure.
- Appropriate HTTP status codes.
- Meaningful error messages.
- Pagination for preview records.
- Validation of query parameters.
- Dataset-not-found handling.
- Stable response schemas.

### Example analytics response

{
  "dataset_id": "generated-dataset-id",
  "dataset_name": "sales_data",
  "summary": {
    "total_rows": 10000,
    "total_columns": 8
  },
  "quality": {
    "missing_values": 125,
    "duplicate_rows": 12
  },
  "insights": [],
  "generated_at": "ISO-8601 timestamp"
}

The example is illustrative. Actual values must come from the uploaded dataset.

### API Documentation

FastAPI's OpenAPI documentation will be available through Swagger UI.

## 4.6 Module F — Reports and Export

**Priority:** P1 — Post-MVP

Planned features:

- Export quality reports.
- Export analytical summaries.
- Download processed datasets.
- Save report configurations.

These features are excluded from the first MVP unless implementation time permits.

---

# 5. MVP Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Upload CSV files | P0 |
| FR-02 | Upload XLSX files | P0 |
| FR-03 | Upload JSON files | P0 |
| FR-04 | Validate uploaded files | P0 |
| FR-05 | Store dataset files locally | P0 |
| FR-06 | Persist dataset metadata in SQLite | P0 |
| FR-07 | List available datasets | P0 |
| FR-08 | Preview dataset records | P0 |
| FR-09 | Calculate dataset statistics | P0 |
| FR-10 | Detect missing values | P0 |
| FR-11 | Detect duplicate records | P0 |
| FR-12 | Generate descriptive analytics | P0 |
| FR-13 | Display charts | P0 |
| FR-14 | Provide REST API access | P0 |
| FR-15 | Provide Swagger documentation | P0 |
| FR-16 | Delete datasets | P0 |
| FR-17 | Export PDF/CSV reports | P1 |
| FR-18 | SQL query editor | P1 |
| FR-19 | API key authentication | P2 |
| FR-20 | AI-generated insights | P2 |

---

# 6. Non-Functional Requirements

## Performance

- Dashboard should load without processing every dataset again.
- Dataset metadata should be retrieved from SQLite.
- Analytics should be calculated on demand or cached where appropriate.
- Preview endpoints should return paginated records.
- File processing should not block the entire API server unnecessarily.

## Reliability

- Invalid files must not crash the application.
- Failed uploads must not create incomplete dataset records.
- Dataset deletion must remove both metadata and associated files.
- Processing errors must be recorded.
- Application restarts must preserve dataset metadata and stored files.

## Data Integrity

- Uploaded source files must remain unchanged.
- Analysis should be reproducible.
- Type inference must be documented as an estimate.
- Missing values must be treated consistently.
- Original records must not be silently modified.

## Maintainability

- Separate file ingestion, validation, analytics, storage and API layers.
- Avoid putting processing logic directly inside API route handlers.
- Use typed request and response models.
- Write unit and integration tests.

---

# 7. Technical Architecture

## 7.1 Architecture Style

Use a **modular monolith** for the MVP.

The frontend and backend are separate applications, but the backend remains one deployable FastAPI service with clearly separated internal modules.

This avoids premature microservice complexity.

## 7.2 High-Level Architecture

Browser
   |
   v
Next.js Frontend
   |
   | HTTP / JSON
   v
FastAPI Backend
   |
   +------------------------+
   |                        |
   v                        v
Dataset Service       Analytics Service
   |                        |
   v                        v
File Processor         Pandas Engine
   |                        |
   +------------+-----------+
                |
                v
          SQLite Database
                |
                v
       Local Dataset Storage

## 7.3 Frontend Architecture

**Technology:**
- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Recharts.
- Lucide icons.

### Frontend routes

| Route | Purpose |
|---|---|
| / | Workspace dashboard |
| /datasets | Dataset listing |
| /datasets/upload | Upload interface |
| /datasets/[id] | Dataset overview |
| /datasets/[id]/quality | Data-quality report |
| /datasets/[id]/analytics | Analytics dashboard |
| /developer | API overview and documentation |

### UI Components

- Sidebar.
- Top navigation.
- Dashboard KPI cards.
- Upload dropzone.
- Dataset table.
- Dataset preview table.
- Data-quality summary.
- Chart components.
- Insight cards.
- Loading states.
- Error states.
- Confirmation dialogs.

The UI should use a consistent design system rather than independent styling for every screen.

## 7.4 Backend Architecture

**Technology:**
- Python 3.
- FastAPI.
- Pandas.
- Pydantic.
- SQLite.
- SQLAlchemy.
- Uvicorn.

### Backend layers

**API Layer**
- Request handling.
- Response formatting.
- Parameter validation.
- HTTP error handling.

**Service Layer**
- Dataset management.
- Upload orchestration.
- Data quality.
- Analytics generation.

**Processing Layer**
- CSV reader.
- Excel reader.
- JSON reader.
- Data normalization.
- Type inference.

**Repository Layer**
- Dataset metadata persistence.
- Database queries.
- Dataset lifecycle management.

**Storage Layer**
- Local filesystem operations.
- Safe file naming.
- Dataset directory management.

## 7.5 Data Processing Pipeline

Upload
  |
  v
File Validation
  |
  v
Format Detection
  |
  v
File Reader
  |
  v
DataFrame Creation
  |
  v
Normalization and Type Inference
  |
  v
Data Quality Analysis
  |
  v
Metadata Persistence
  |
  v
Analytics Generation
  |
  v
Frontend and REST API

Important implementation rules:

1. Never execute uploaded code or files.
2. Validate file signatures and actual content.
3. Avoid trusting user-provided filenames.
4. Store source files separately from derived metadata.
5. Do not modify the original uploaded file.
6. Handle malformed data with explicit errors.
7. Set configurable processing limits to protect local resources.

---

# 8. Database Design

Use SQLite for metadata persistence.

## 8.1 datasets

| Field | Type | Description |
|---|---|---|
| id | TEXT | Primary key |
| name | TEXT | Dataset display name |
| original_filename | TEXT | Original filename |
| stored_filename | TEXT | Safe internal filename |
| file_format | TEXT | csv, xlsx or json |
| file_path | TEXT | Relative storage path |
| file_size | INTEGER | Bytes |
| row_count | INTEGER | Total records |
| column_count | INTEGER | Total columns |
| status | TEXT | Processing status |
| created_at | DATETIME | Upload timestamp |
| updated_at | DATETIME | Last update |

## 8.2 dataset_columns

| Field | Type | Description |
|---|---|---|
| id | INTEGER | Primary key |
| dataset_id | TEXT | Dataset reference |
| column_name | TEXT | Column name |
| inferred_type | TEXT | Inferred type |
| missing_count | INTEGER | Missing values |
| unique_count | INTEGER | Unique values |
| position | INTEGER | Original column position |

## 8.3 dataset_quality

| Field | Type | Description |
|---|---|---|
| id | INTEGER | Primary key |
| dataset_id | TEXT | Dataset reference |
| total_rows | INTEGER | Row count |
| total_columns | INTEGER | Column count |
| missing_values | INTEGER | Missing cell count |
| duplicate_rows | INTEGER | Duplicate record count |
| empty_columns | INTEGER | Empty column count |
| generated_at | DATETIME | Analysis timestamp |

## 8.4 analytics_cache

| Field | Type | Description |
|---|---|---|
| id | INTEGER | Primary key |
| dataset_id | TEXT | Dataset reference |
| analysis_type | TEXT | Analysis category |
| result_json | TEXT | Serialized result |
| generated_at | DATETIME | Generation timestamp |

### Database constraints

- Foreign keys must be enabled.
- Dataset IDs must be unique.
- Dataset deletion must clean up related records.
- Store timestamps in a consistent timezone convention.
- Store filesystem paths as relative paths within the configured storage root.

---

# 9. Local Storage Design

Use a dedicated application data directory.

datalens-data/
    database/
        datalens.db

    uploads/
        <dataset-id>/
            original.csv
            original.xlsx
            original.json

    cache/
        <dataset-id>/
            analytics.json

    logs/
        app.log

Storage should be configurable using environment variables.

Example:

DATALENS_DATA_DIR=./datalens-data
DATALENS_MAX_UPLOAD_MB=25

The application must create required directories automatically.

Do not store uploaded files inside the frontend public directory.

---

# 10. API Contract

Base URL:

http://localhost:8000/api

## Health Check

GET /health

Expected response:

{
  "status": "ok",
  "service": "datalens"
}

## Upload Dataset

POST /datasets/upload

Content type: multipart/form-data

Parameters:
- file: uploaded file.
- name: optional dataset display name.

Expected response:

{
  "id": "generated-id",
  "name": "Sales Dataset",
  "format": "csv",
  "status": "completed"
}

## List Datasets

GET /datasets

Query parameters:
- page
- page_size

## Get Dataset

GET /datasets/{dataset_id}

## Preview Dataset

GET /datasets/{dataset_id}/preview

Query parameters:
- page
- page_size

## Data Quality

GET /datasets/{dataset_id}/quality

## Analytics

GET /datasets/{dataset_id}/analytics

Optional query parameters:
- refresh: boolean.

## Delete Dataset

DELETE /datasets/{dataset_id}

All endpoint responses must follow documented Pydantic schemas.

---

# 11. Diwali-Inspired Visual Design System

## 11.1 Design Direction

The product should feel like a premium analytics platform with a subtle festive identity.

Avoid making the interface look like a festival invitation, greeting card or decorative template.

The Diwali identity should be expressed through restrained color, small geometric details, warm surfaces and elegant typography.

## 11.2 Color Palette

| Token | Suggested Color | Usage |
|---|---|---|
| Background | #FFFDF8 | Main background |
| Surface | #FFFFFF | Cards and panels |
| Primary | #9B681E | Primary actions |
| Gold | #C99A3A | Highlights |
| Saffron | #E9A23B | Accent |
| Deep Maroon | #713B36 | Secondary accent |
| Text | #28251F | Primary text |
| Muted | #817B70 | Secondary text |
| Border | #EEE7D9 | Dividers |

## 11.3 Typography

- Headings: Playfair Display.
- Body: DM Sans.
- Numbers and metrics: DM Sans with tabular numerals.

## 11.4 Design Principles

- Light-first interface.
- Warm ivory background.
- White content surfaces.
- Restrained antique-gold accents.
- Clear data visualization.
- Minimal borders and soft shadows.
- Consistent spacing.
- Accessible contrast.
- Minimal geometric festive motifs.

The festive styling must never reduce the readability of charts, tables or technical information.

## 11.5 Core UI Pages

1. Dashboard.
2. Dataset upload.
3. Dataset overview.
4. Data-quality report.
5. Analytics studio.
6. Developer portal.

---

# 12. Error Handling

The application must handle the following conditions.

| Scenario | Expected Behaviour |
|---|---|
| Unsupported file format | 415 Unsupported Media Type |
| File exceeds upload limit | 413 Payload Too Large |
| Empty file | Clear validation error |
| Invalid CSV | Processing error |
| Invalid Excel workbook | Processing error |
| Malformed JSON | Processing error |
| Unsupported JSON structure | Clear validation error |
| Dataset not found | 404 Not Found |
| Invalid pagination | 422 Validation Error |
| Unexpected server failure | 500 Internal Server Error |

Do not return raw stack traces or filesystem paths to the frontend.

---

# 13. Testing Strategy

## Unit Tests

- File format detection.
- CSV parsing.
- Excel parsing.
- JSON normalization.
- Type inference.
- Missing-value detection.
- Duplicate detection.
- Descriptive statistics.
- Aggregation functions.
- Dataset ID validation.

## Integration Tests

- Upload CSV and retrieve metadata.
- Upload XLSX and retrieve preview.
- Upload JSON and retrieve analytics.
- Delete dataset and verify storage cleanup.
- Retrieve quality report.
- Retrieve analytics through API.
- Restart backend and verify persistence.

## Frontend Tests

- Upload validation.
- Dataset listing.
- Loading states.
- Error states.
- Empty states.
- Dataset navigation.
- Chart rendering.

## Acceptance Test

Upload a sales dataset containing product, category, revenue, quantity and transaction date.

Verify:
- Correct row and column counts.
- Correct missing-value count.
- Correct duplicate count.
- Correct revenue sum.
- Correct average revenue.
- Correct category aggregation.
- Correct API responses.

All expected results must be calculated independently from the test fixture and compared with application output.

---

# 14. Recommended Repository Structure

datalens/
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── datasets/
│   │   └── developer/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── datasets/
│   │   ├── analytics/
│   │   ├── charts/
│   │   └── ui/
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   └── types/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   └── routes/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── exceptions.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── dataset_service.py
│   │   │   ├── quality_service.py
│   │   │   └── analytics_service.py
│   │   ├── processors/
│   │   │   ├── csv_processor.py
│   │   │   ├── excel_processor.py
│   │   │   └── json_processor.py
│   │   ├── repositories/
│   │   ├── storage/
│   │   └── database/
│   ├── tests/
│   └── requirements.txt
│
├── datalens-data/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── API_SPECIFICATION.md
│
├── .env.example
├── .gitignore
└── README.md

The actual application data directory must be excluded from Git.

---

# 15. Development Milestones

## Milestone 1 — Foundation

- Initialize frontend and backend.
- Configure environment variables.
- Configure SQLite.
- Implement health check.
- Establish API communication.
- Implement base UI layout and design tokens.

**Completion:** Frontend communicates with the backend successfully.

## Milestone 2 — File Ingestion

- Implement CSV reader.
- Implement XLSX reader.
- Implement JSON reader.
- Add file validation.
- Implement local storage.
- Persist metadata.

**Completion:** All three supported file types can be uploaded and retrieved.

## Milestone 3 — Data Quality Engine

- Implement schema inspection.
- Implement type inference.
- Implement missing-value detection.
- Implement duplicate detection.
- Implement quality report.

**Completion:** Uploaded datasets generate accurate quality reports.

## Milestone 4 — Analytics Engine

- Implement descriptive statistics.
- Implement aggregations.
- Implement categorical analysis.
- Implement date-based analysis where supported.
- Implement chart-ready output.

**Completion:** Analytics endpoints return correct results.

## Milestone 5 — Frontend Product Experience

- Implement workspace dashboard.
- Implement upload experience.
- Implement dataset listing.
- Implement dataset overview.
- Implement quality report.
- Implement analytics dashboard.

**Completion:** A user can complete the full visual workflow.

## Milestone 6 — Developer API

- Implement all MVP endpoints.
- Add pagination.
- Add response schemas.
- Add error handling.
- Configure Swagger documentation.

**Completion:** External local applications can retrieve dataset insights through the API.

## Milestone 7 — Testing and Release

- Run unit tests.
- Run integration tests.
- Verify all supported file formats.
- Test invalid inputs.
- Test application restart and persistence.
- Verify responsive UI.
- Update documentation.

**Completion:** The local MVP is stable and demonstrable.

---

# 16. Explicitly Out of Scope

The following are not part of MVP 1.0:

- User registration and authentication.
- Cloud storage.
- Multi-user collaboration.
- SQL query editor.
- AI-powered natural-language analysis.
- AI-generated recommendations.
- Automated scheduled pipelines.
- Billing and subscriptions.
- Enterprise access controls.
- Real-time analytics.

These should be evaluated after the core product is working.

---

# 17. Definition of Done

DataLens MVP 1.0 is considered complete when:

1. The application runs locally through documented startup commands.
2. The user can upload CSV, XLSX and JSON datasets.
3. Uploaded files are stored safely on the local filesystem.
4. Metadata persists in SQLite.
5. Dataset previews work correctly.
6. Data-quality reports are accurate.
7. Analytics calculations are verified against test fixtures.
8. The frontend displays real results from the backend.
9. All MVP REST API endpoints work.
10. Swagger documentation is available.
11. Dataset deletion cleans up associated files and records.
12. Automated tests pass.
13. The interface follows the approved light Diwali-inspired design.
14. Documentation explains setup, supported formats, limitations and API usage.

---

# 18. Future Roadmap

## V1 — Advanced Analytics

- SQL Explorer.
- Report export.
- Saved analysis.
- Advanced visualizations.
- Dataset comparison.

## V2 — Intelligent Analytics

- Natural-language questions about datasets.
- AI-generated explanations.
- Automated anomaly detection.
- Suggested visualizations.
- Insight recommendations.

## V3 — Connected Data Platform

- PostgreSQL and other database connectors.
- Cloud object storage.
- User accounts and API keys.
- Team workspaces.
- Scheduled processing.
- Public deployment with authentication and authorization.

---

# 19. Final Product Statement

DataLens is a local-first analytics and developer platform that converts raw CSV, Excel and JSON datasets into structured, understandable and accessible analytical information.

Its MVP combines a Python-based processing engine, a visual analytics workspace and a FastAPI-powered developer interface.

**Core product workflow:**

Upload → Inspect → Validate → Analyze → Visualize → Integrate

**Product tagline:**

Understand your data. Discover what matters.

**MVP release goal:**

A reliable, polished and fully functional local-first product that demonstrates complete data ingestion, processing, analytics and API integration.