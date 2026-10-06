const { pool } = require('../config/db');
const { fail } = require('../utils/component04Validation');

// The creator when they are an admin, otherwise the actual household owner.
// A global admin role alone never grants access to another household's requests.
async function responsibleOwner(db, chore) {
  const result = await db.query(`SELECT u.id FROM users u
    WHERE (u.id=$1 AND u.role='admin') OR
      u.id=(SELECT created_by FROM families WHERE id=$2)
    ORDER BY CASE WHEN u.id=$1 AND u.role='admin' THEN 0 ELSE 1 END LIMIT 1`,
  [chore.created_by, chore.family_id]);
  return result.rows[0]?.id || null;
}

async function eligibleChore(db, id, userId, lock = false) {
  const chore = (await db.query(`SELECT * FROM chores WHERE id=$1 ${lock ? 'FOR UPDATE' : ''}`, [id])).rows[0];
  if (!chore || chore.assigned_to !== userId) throw fail('Assigned chore not found.', 404);
  if (chore.status !== 'pending' || !chore.due_date) throw fail('Choose a pending chore with a scheduled due time.', 409);
  if (chore.family_id && !(await db.query('SELECT 1 FROM family_members WHERE family_id=$1 AND user_id=$2', [chore.family_id, userId])).rowCount) throw fail('Assigned chore not found.', 404);
  const recipientId = await responsibleOwner(db, chore);
  if (!recipientId || recipientId === userId) throw fail('This chore has no separate responsible admin or household owner.', 409);
  return { chore, recipientId };
}

async function notifyRequest(db, request, chore, recipient, title, type = 'time_change_request') {
  await db.query(`INSERT INTO notifications(user_id,title,message,type,chore_id,time_request_id)
    VALUES($1,$2,$3,$4,$5,$6)`, [recipient, title, chore.title, type, chore.id, request.id]);
}

// This uses the project's existing startup-migration convention, without deleting data.
async function ensureChoreTimeRequestSchema() {
  await pool.query(`CREATE TABLE IF NOT EXISTS public.chore_time_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chore_id UUID NOT NULL REFERENCES public.chores(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK(length(trim(message)) BETWEEN 1 AND 2000),
    original_due_date TIMESTAMPTZ NOT NULL,
    requested_due_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
    admin_response TEXT,
    admin_dismissed_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK(requester_id<>recipient_id)
  )`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS chore_time_requests_one_pending_idx
    ON public.chore_time_requests(chore_id,requester_id) WHERE status='PENDING'`);
  await pool.query('CREATE INDEX IF NOT EXISTS chore_time_requests_recipient_idx ON public.chore_time_requests(recipient_id,created_at DESC)');
  await pool.query(`ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS chore_id UUID REFERENCES public.chores(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS time_request_id UUID REFERENCES public.chore_time_requests(id) ON DELETE SET NULL`);
}
module.exports = { responsibleOwner, eligibleChore, notifyRequest, ensureChoreTimeRequestSchema };
