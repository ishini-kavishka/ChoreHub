-- Member 4: Progress, Notification & Settings schema
-- Safe to run multiple times (IF NOT EXISTS / DO $$ blocks).

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    chore_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    chore_completions BOOLEAN NOT NULL DEFAULT TRUE,
    family_updates BOOLEAN NOT NULL DEFAULT TRUE,
    announcements BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_time TEXT NOT NULL DEFAULT '10min',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'light',
    language TEXT NOT NULL DEFAULT 'en',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Safe, additive upgrade for databases created before completion tracking.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'chores' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.chores ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'chores' AND column_name = 'completed_by'
    ) THEN
        ALTER TABLE public.chores ADD COLUMN completed_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS notification_settings_user_idx ON notification_settings (user_id);
CREATE INDEX IF NOT EXISTS user_preferences_user_idx ON user_preferences (user_id);
CREATE INDEX IF NOT EXISTS chores_completed_at_idx ON chores (completed_at) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, is_read);
