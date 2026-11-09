-- ==============================================================================
-- DataLens v2.0 - Combined Migration Script for Supabase SQL Editor
-- Tables: dataset_metadata, analysis_history, browser_sessions, developer_api_keys
-- Storage: datalens-assets bucket
-- Security: Row Level Security (RLS) policies
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Table: dataset_metadata
-- Stores sanitized schema summaries; zero raw rows.
CREATE TABLE IF NOT EXISTS public.dataset_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_format VARCHAR(10) NOT NULL CHECK (file_format IN ('csv', 'xlsx', 'json')),
    row_count INTEGER NOT NULL CHECK (row_count >= 0),
    column_count INTEGER NOT NULL CHECK (column_count > 0),
    column_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dataset_metadata_owner_id ON public.dataset_metadata(owner_id);
CREATE INDEX IF NOT EXISTS idx_dataset_metadata_created_at ON public.dataset_metadata(created_at DESC);

ALTER TABLE public.dataset_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only view their own dataset metadata" ON public.dataset_metadata;
DROP POLICY IF EXISTS "Users can only insert their own dataset metadata" ON public.dataset_metadata;
DROP POLICY IF EXISTS "Users can only update their own dataset metadata" ON public.dataset_metadata;
DROP POLICY IF EXISTS "Users can only delete their own dataset metadata" ON public.dataset_metadata;

CREATE POLICY "Users can only view their own dataset metadata"
    ON public.dataset_metadata FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can only insert their own dataset metadata"
    ON public.dataset_metadata FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can only update their own dataset metadata"
    ON public.dataset_metadata FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can only delete their own dataset metadata"
    ON public.dataset_metadata FOR DELETE
    USING (auth.uid() = owner_id);


-- 3. Table: analysis_history
CREATE TABLE IF NOT EXISTS public.analysis_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dataset_id UUID REFERENCES public.dataset_metadata(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_analysis_history_owner_id ON public.analysis_history(owner_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_dataset_id ON public.analysis_history(dataset_id);

ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only view their own analysis history" ON public.analysis_history;
DROP POLICY IF EXISTS "Users can only insert their own analysis history" ON public.analysis_history;
DROP POLICY IF EXISTS "Users can only delete their own analysis history" ON public.analysis_history;

CREATE POLICY "Users can only view their own analysis history"
    ON public.analysis_history FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can only insert their own analysis history"
    ON public.analysis_history FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can only delete their own analysis history"
    ON public.analysis_history FOR DELETE
    USING (auth.uid() = owner_id);


-- 4. Table: browser_sessions
CREATE TABLE IF NOT EXISTS public.browser_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_browser_sessions_hash ON public.browser_sessions(session_hash);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_owner ON public.browser_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_expires ON public.browser_sessions(expires_at);

ALTER TABLE public.browser_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own browser sessions" ON public.browser_sessions;
DROP POLICY IF EXISTS "Users modify own browser sessions" ON public.browser_sessions;

CREATE POLICY "Users view own browser sessions"
    ON public.browser_sessions FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users modify own browser sessions"
    ON public.browser_sessions FOR ALL
    USING (auth.uid() = owner_id);


-- 5. Table: developer_api_keys
CREATE TABLE IF NOT EXISTS public.developer_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    browser_session_id UUID REFERENCES public.browser_sessions(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_prefix VARCHAR(16) NOT NULL,
    scopes JSONB NOT NULL DEFAULT '["datasets:read", "analytics:read", "insights:read", "exports:create"]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_developer_keys_hash ON public.developer_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_developer_keys_owner ON public.developer_api_keys(owner_id);
CREATE INDEX IF NOT EXISTS idx_developer_keys_session ON public.developer_api_keys(browser_session_id);

ALTER TABLE public.developer_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own api keys" ON public.developer_api_keys;
DROP POLICY IF EXISTS "Users modify own api keys" ON public.developer_api_keys;

CREATE POLICY "Users view own api keys"
    ON public.developer_api_keys FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users modify own api keys"
    ON public.developer_api_keys FOR ALL
    USING (auth.uid() = owner_id);


-- 6. Storage Bucket: datalens-assets (reserved)
INSERT INTO storage.buckets (id, name, public)
VALUES ('datalens-assets', 'datalens-assets', false)
ON CONFLICT (id) DO NOTHING;

