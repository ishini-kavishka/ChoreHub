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
  // This prevents:
  // "no schema has been selected to create in"
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
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

  console.log('Database schema checked successfully.');
}

module.exports = {
  pool,
  ensureAuthSchema,
};