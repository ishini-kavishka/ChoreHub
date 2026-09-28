const crypto = require('crypto');
const { pool } = require('../config/db');

const appError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

function generateInviteCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

async function createFamily(req, res, next) {
  const client = await pool.connect();
  try {
    const userId = req.userId;
    const { name } = req.body || {};

    if (typeof name !== 'string' || !name.trim()) {
      throw appError('Family name is required.');
    }

    await client.query('BEGIN');

    const inviteCode = generateInviteCode();
    const familyResult = await client.query(
      `INSERT INTO families (name, invite_code, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), inviteCode, userId]
    );

    const family = familyResult.rows[0];

    await client.query(
      `INSERT INTO family_members (family_id, user_id, role)
       VALUES ($1, $2, 'admin')
       ON CONFLICT (family_id, user_id) DO NOTHING`,
      [family.id, userId]
    );

    await client.query('COMMIT');
    return res.status(201).json({ family });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
}

async function joinFamily(req, res, next) {
  try {
    const userId = req.userId;
    const { invite_code } = req.body || {};

    if (typeof invite_code !== 'string' || !invite_code.trim()) {
      throw appError('Invite code is required.');
    }

    const familyResult = await pool.query(
      'SELECT * FROM families WHERE UPPER(invite_code) = UPPER($1)',
      [invite_code.trim()]
    );

    const family = familyResult.rows[0];
    if (!family) throw appError('Invalid family invite code.', 404);

    await pool.query(
      `INSERT INTO family_members (family_id, user_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT (family_id, user_id) DO NOTHING`,
      [family.id, userId]
    );

    return res.json({ message: 'Successfully joined family!', family });
  } catch (error) {
    return next(error);
  }
}

async function getMyFamily(req, res, next) {
  try {
    const userId = req.userId;
    const memberResult = await pool.query(
      `SELECT f.*, fm.role AS user_role
       FROM family_members fm
       JOIN families f ON fm.family_id = f.id
       WHERE fm.user_id = $1 LIMIT 1`,
      [userId]
    );

    const family = memberResult.rows[0] || null;
    if (!family) {
      // Return self as single member list if user has no family yet
      const selfUser = await pool.query(
        'SELECT id, full_name AS name, email, profile_image_url AS avatar FROM users WHERE id = $1',
        [userId]
      );
      return res.json({ family: null, members: selfUser.rows });
    }

    const membersResult = await pool.query(
      `SELECT u.id, u.full_name AS name, u.email, u.profile_image_url AS avatar, fm.role, fm.joined_at
       FROM family_members fm
       JOIN users u ON fm.user_id = u.id
       WHERE fm.family_id = $1
       ORDER BY fm.joined_at ASC`,
      [family.id]
    );

    return res.json({ family, members: membersResult.rows });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createFamily,
  joinFamily,
  getMyFamily,
};
