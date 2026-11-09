# DataLens Security & Privacy Architecture

**Product:** DataLens (Cloud 2.0)  
**Classification:** Public Web Application & Developer Service

---

## 1. Zero-Retention Data Privacy Model

DataLens operates under a strict **ephemeral memory-only** execution contract:
- **No Raw File Persistence:** Uploaded files (`.csv`, `.xlsx`, `.json`) are parsed directly into memory (`io.BytesIO`). They are never written to server disks or Supabase Storage.
- **Deallocation:** Immediately after generating tabular statistics and preview records, in-memory buffers are closed and freed for garbage collection.
- **Metadata Separation:** If a user chooses to save a dataset, only high-level sanitized metadata (dataset name, total rows, column names, inferred data types, and missing rates) is stored in Supabase PostgreSQL.

---

## 2. Authentication & Identity

- **Supabase Anonymous Auth:** Issues cryptographically signed JSON Web Tokens (JWT) containing anonymous user UUIDs in the `sub` claim.
- **Token Verification:** The FastAPI backend verifies JWT signatures, expiration (`exp`), issuer (`iss`), and audience (`aud`).
- **Least-Privilege Isolation:** PostgreSQL Row-Level Security (RLS) ensures each user can strictly view, insert, update, or delete only their own metadata records (`auth.uid() = owner_id`).

---

## 3. Upload & Processing Protections

- **File Size Ceiling:** Configured at 25 MB (`MAX_UPLOAD_SIZE_MB`). Requests exceeding this limit are rejected immediately (`HTTP 413`).
- **MIME & Magic Bytes Inspection:** Validates actual binary content headers to prevent spoofed executables.
- **Decompression-Bomb Defense:** Zip expansion ratios are restricted when reading `.xlsx` archives.
- **Processing Timeouts:** Backend file parsing operations time out after 15 seconds to prevent denial-of-service (DoS).

---

## 4. API & Network Security

- **CORS Allowlist:** Configured to accept requests exclusively from verified frontend domains and local dev environments (`localhost:3000`).
- **Input Sanitization:** Header fields and column names are trimmed and stripped of non-printable or malicious script injection characters.
- **External AI Boundaries:** Groq API calls receive **only aggregated metrics** (e.g. mean, min, max, null percentages). Raw data rows are never forwarded to third-party LLM providers.

