
-- Secure storage for OAuth tokens
CREATE TABLE IF NOT EXISTS user_ga4_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-specific GA4 settings
CREATE TABLE IF NOT EXISTS user_ga4_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    selected_property_id TEXT,
    property_name TEXT,
    account_id TEXT,
    sync_frequency TEXT DEFAULT 'manual',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ga4_settings_user_id ON user_ga4_settings(user_id);
