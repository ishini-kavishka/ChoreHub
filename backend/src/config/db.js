const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Database-backed routes will be unavailable.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function ensureAuthSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS password_reset_tokens_lookup_idx ON password_reset_tokens (token_hash, used, expires_at)');

  // Families
  await pool.query(`
    CREATE TABLE IF NOT EXISTS families (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Family Members
  await pool.query(`
    CREATE TABLE IF NOT EXISTS family_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_family_user UNIQUE (family_id, user_id)
    )
  `);

  // Chores
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id UUID REFERENCES families(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'General',
      priority TEXT NOT NULL DEFAULT 'medium',
      due_date TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'pending',
      assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
      created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recurrence TEXT DEFAULT 'none',
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Notifications
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS chores_family_idx ON chores (family_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS chores_assigned_idx ON chores (assigned_to)');
  await pool.query('CREATE INDEX IF NOT EXISTS chores_created_by_idx ON chores (created_by)');
  await pool.query('CREATE INDEX IF NOT EXISTS chores_status_due_idx ON chores (status, due_date)');
  await pool.query('CREATE INDEX IF NOT EXISTS family_members_user_idx ON family_members (user_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, is_read)');

  // Notification Settings (Member 4)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      chore_reminders BOOLEAN NOT NULL DEFAULT TRUE,
      chore_completions BOOLEAN NOT NULL DEFAULT TRUE,
      family_updates BOOLEAN NOT NULL DEFAULT TRUE,
      announcements BOOLEAN NOT NULL DEFAULT FALSE,
      reminder_time TEXT NOT NULL DEFAULT '10min',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Preferences (Member 4)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      theme TEXT NOT NULL DEFAULT 'light',
      language TEXT NOT NULL DEFAULT 'en',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Safe: add completed_by column to chores only if missing (Member 4)
  await pool.query(`
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
    $$
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS chores_completed_at_idx ON chores (completed_at) WHERE status = \'completed\'');

}

module.exports = { pool, ensureAuthSchema };
