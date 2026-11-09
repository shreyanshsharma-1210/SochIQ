-- DataLens Database Migration: Updated Authentication & Temporary API Credential Architecture
-- Migration: browser_sessions & developer_api_keys with RLS and cryptographic hashing

-- 1. Table: browser_sessions
-- Represents a browser-scoped anonymous session stored via HttpOnly cookie
CREATE TABLE IF NOT EXISTS public.browser_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 hash of random session token
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,           -- Last activity + 30 minutes
    revoked_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_browser_sessions_hash ON public.browser_sessions(session_hash);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_owner ON public.browser_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_expires ON public.browser_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.browser_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own browser sessions" ON public.browser_sessions;
DROP POLICY IF EXISTS "Users modify own browser sessions" ON public.browser_sessions;

CREATE POLICY "Users view own browser sessions"
    ON public.browser_sessions FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users modify own browser sessions"
    ON public.browser_sessions FOR ALL
    USING (auth.uid() = owner_id);


-- 2. Table: developer_api_keys
-- Represents separate temporary API keys for external cURL / script access
CREATE TABLE IF NOT EXISTS public.developer_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    browser_session_id UUID REFERENCES public.browser_sessions(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL UNIQUE,       -- SHA-256 hash of API key
    key_prefix VARCHAR(16) NOT NULL,            -- e.g. "dl_live_a1b2..." for identification
    scopes JSONB NOT NULL DEFAULT '["datasets:read", "analytics:read", "insights:read", "exports:create"]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,            -- Last activity + 30 minutes
    revoked_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_developer_keys_hash ON public.developer_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_developer_keys_owner ON public.developer_api_keys(owner_id);
CREATE INDEX IF NOT EXISTS idx_developer_keys_session ON public.developer_api_keys(browser_session_id);

-- Enable RLS
ALTER TABLE public.developer_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own api keys" ON public.developer_api_keys;
DROP POLICY IF EXISTS "Users modify own api keys" ON public.developer_api_keys;

CREATE POLICY "Users view own api keys"
    ON public.developer_api_keys FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users modify own api keys"
    ON public.developer_api_keys FOR ALL
    USING (auth.uid() = owner_id);

