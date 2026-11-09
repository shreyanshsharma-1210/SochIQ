-- DataLens Database Migration: Initial Schema & Row-Level Security
-- Schema: dataset_metadata & analysis_history
-- Target: Supabase PostgreSQL

-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Table: dataset_metadata
-- Stores metadata only; NO raw rows or original files are saved here.
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

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_dataset_metadata_owner_id ON public.dataset_metadata(owner_id);
CREATE INDEX IF NOT EXISTS idx_dataset_metadata_created_at ON public.dataset_metadata(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.dataset_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Users can only view their own dataset metadata" ON public.dataset_metadata;
DROP POLICY IF EXISTS "Users can only insert their own dataset metadata" ON public.dataset_metadata;
DROP POLICY IF EXISTS "Users can only delete their own dataset metadata" ON public.dataset_metadata;
DROP POLICY IF EXISTS "Users can only update their own dataset metadata" ON public.dataset_metadata;

-- Policies ensuring complete cross-user isolation
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
-- Optional historical analytical summaries and configurations
CREATE TABLE IF NOT EXISTS public.analysis_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dataset_id UUID REFERENCES public.dataset_metadata(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for analysis queries
CREATE INDEX IF NOT EXISTS idx_analysis_history_owner_id ON public.analysis_history(owner_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_dataset_id ON public.analysis_history(dataset_id);

-- Enable RLS
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


-- 4. Architectural reservation: Supabase Storage bucket setup
-- Bucket 'datalens-assets' is created as private; zero raw dataset uploads in MVP
INSERT INTO storage.buckets (id, name, public)
VALUES ('datalens-assets', 'datalens-assets', false)
ON CONFLICT (id) DO NOTHING;

