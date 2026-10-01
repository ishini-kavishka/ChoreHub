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
  await pool.query("ALTER TABLE family_members ADD COLUMN IF NOT EXISTS relationship TEXT DEFAULT 'Other'");

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

  // Indexes
  await pool.query('CREATE INDEX IF NOT EXISTS chores_family_idx ON chores (family_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS chores_assigned_idx ON chores (assigned_to)');
  await pool.query('CREATE INDEX IF NOT EXISTS chores_created_by_idx ON chores (created_by)');
  await pool.query('CREATE INDEX IF NOT EXISTS chores_status_due_idx ON chores (status, due_date)');
  await pool.query('CREATE INDEX IF NOT EXISTS family_members_user_idx ON family_members (user_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, is_read)');
}

module.exports = { pool, ensureAuthSchema };
