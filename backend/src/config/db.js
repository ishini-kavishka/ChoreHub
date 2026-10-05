const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn(
    'DATABASE_URL is not set. Database-backed routes will be unavailable.'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function ensureAuthSchema() {
  // Explicitly use the public schema.
  await pool.query('SET search_path TO public');

  // =========================================================
  // Password Reset Tokens
  // =========================================================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS password_reset_tokens_lookup_idx
    ON public.password_reset_tokens (token_hash, used, expires_at)
  `);

  // =========================================================
  // Support Tickets
  // =========================================================
  await pool.query(`
    CREATE SEQUENCE IF NOT EXISTS public.support_ticket_number_seq
    START WITH 1045
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.support_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_number TEXT NOT NULL UNIQUE,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      admin_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS support_tickets_user_created_idx
    ON public.support_tickets (user_id, created_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS support_tickets_status_created_idx
    ON public.support_tickets (status, created_at DESC)
  `);

  // =========================================================
  // Families
  // =========================================================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.families (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // =========================================================
  // Family Members
  // =========================================================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.family_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_family_user UNIQUE (family_id, user_id)
    )
  `);

  await pool.query(`
    ALTER TABLE public.family_members
    ADD COLUMN IF NOT EXISTS relationship TEXT DEFAULT 'Other'
  `);

  // =========================================================
  // Chores
  // =========================================================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.chores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'General',
      priority TEXT NOT NULL DEFAULT 'medium',
      due_date TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'pending',
      assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
      created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      recurrence TEXT DEFAULT 'none',
      completed_at TIMESTAMPTZ,
      completed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add columns safely for databases where chores table already exists
  await pool.query(`
    ALTER TABLE public.chores
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ
  `);

  await pool.query(`
    ALTER TABLE public.chores
    ADD COLUMN IF NOT EXISTS completed_by UUID
    REFERENCES public.users(id) ON DELETE SET NULL
  `);

  // =========================================================
  // Notifications
  // =========================================================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      reminder_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add reminder_at for databases created before this column existed
  await pool.query(`
    ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ
  `);

  // =========================================================
  // Notification Settings
  // =========================================================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.notification_settings (
      user_id UUID PRIMARY KEY
        REFERENCES public.users(id) ON DELETE CASCADE,
      chore_reminders BOOLEAN NOT NULL DEFAULT TRUE,
      due_date_alerts BOOLEAN NOT NULL DEFAULT TRUE,
      weekly_summary BOOLEAN NOT NULL DEFAULT TRUE,
      chore_completions BOOLEAN NOT NULL DEFAULT TRUE,
      family_updates BOOLEAN NOT NULL DEFAULT TRUE,
      announcements BOOLEAN NOT NULL DEFAULT FALSE,
      reminder_time TEXT NOT NULL DEFAULT '10min',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`ALTER TABLE public.notification_settings
    ADD COLUMN IF NOT EXISTS due_date_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS weekly_summary BOOLEAN NOT NULL DEFAULT TRUE`);

  // =========================================================
  // User Preferences
  // =========================================================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.user_preferences (
      user_id UUID PRIMARY KEY
        REFERENCES public.users(id) ON DELETE CASCADE,
      theme TEXT NOT NULL DEFAULT 'light',
      language TEXT NOT NULL DEFAULT 'en',
      brightness INTEGER NOT NULL DEFAULT 70,
      auto_brightness BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE public.user_preferences
    ADD COLUMN IF NOT EXISTS brightness INTEGER NOT NULL DEFAULT 70;
    ALTER TABLE public.user_preferences
    ADD COLUMN IF NOT EXISTS auto_brightness BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  // =========================================================
  // Supported Languages (Admin-managed client languages)
  // =========================================================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.supported_languages (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      native_name TEXT NOT NULL,
      flag TEXT NOT NULL DEFAULT '🌐',
      is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    INSERT INTO public.supported_languages (code, name, native_name, flag, is_enabled, sort_order)
    VALUES
      ('en', 'English', 'English', '🌐', TRUE, 1),
      ('si', 'Sinhala', 'සිංහල', '🇱🇰', TRUE, 2),
      ('ta', 'Tamil', 'தமிழ்', '🇮🇳', TRUE, 3)
    ON CONFLICT (code) DO NOTHING
  `);

  // =========================================================
  // Indexes
  // =========================================================
  await pool.query(`
    CREATE INDEX IF NOT EXISTS chores_family_idx
    ON public.chores (family_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS chores_assigned_idx
    ON public.chores (assigned_to)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS chores_created_by_idx
    ON public.chores (created_by)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS chores_status_due_idx
    ON public.chores (status, due_date)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS family_members_user_idx
    ON public.family_members (user_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS notifications_user_idx
    ON public.notifications (user_id, is_read)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS chores_completed_at_idx
    ON public.chores (completed_at)
    WHERE status = 'completed'
  `);

  console.log('Database schema checked successfully.');
}

module.exports = {
  pool,
  ensureAuthSchema,
};