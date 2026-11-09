-- ==============================================================================
-- SochIQ Migration 003: Temporary Cloud Workspace & Storage Policies
-- Bucket: sochiq-temporary-datasets (Private)
-- ==============================================================================

-- 1. Create Private Storage Bucket (if not already created by backend)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sochiq-temporary-datasets', 'sochiq-temporary-datasets', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies: Restrict access to authenticated owners
CREATE POLICY "Owners can access their own session files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'sochiq-temporary-datasets' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'sochiq-temporary-datasets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Ensure columns exist on dataset_metadata
ALTER TABLE public.dataset_metadata
ADD COLUMN IF NOT EXISTS browser_session_id UUID,
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ready';

-- 4. Ensure columns exist on analysis_history
ALTER TABLE public.analysis_history
ADD COLUMN IF NOT EXISTS browser_session_id UUID;

-- 5. Cleanup Index for Inactivity Expiration
CREATE INDEX IF NOT EXISTS idx_browser_sessions_expires_at ON public.browser_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_dataset_metadata_browser_session ON public.dataset_metadata(browser_session_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_dataset_id ON public.analysis_history(dataset_id);

