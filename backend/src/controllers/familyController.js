const { notifyFamilyUpdate } = require('../services/notificationDeliveryService');
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
      `INSERT INTO family_members (family_id, user_id, role, relationship)
       VALUES ($1, $2, 'admin', 'Parent')
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
  let db;
  try {
    db = await pool.connect();
    await db.query('BEGIN');
    const userId = req.userId;
    const { invite_code } = req.body || {};

    if (typeof invite_code !== 'string' || !invite_code.trim()) {
      throw appError('Invite code is required.');
    }

    const familyResult = await db.query(
      'SELECT * FROM families WHERE UPPER(invite_code) = UPPER($1)',
      [invite_code.trim()]
    );

    const family = familyResult.rows[0];
    if (!family) throw appError('Invalid family invite code.', 404);

    const inserted = await db.query(
      `INSERT INTO family_members (family_id, user_id, role, relationship)
       VALUES ($1, $2, 'member', 'Other')
       ON CONFLICT (family_id, user_id) DO NOTHING RETURNING user_id`,
      [family.id, userId]
    );

    if(inserted.rowCount) {
      const user = (await db.query('SELECT full_name FROM users WHERE id=$1',[userId])).rows[0];
      await notifyFamilyUpdate(db,family.id,userId,'Family Update', `${user.full_name} joined the household.`);
    }
    await db.query('COMMIT');
    return res.json({ message: 'Successfully joined family!', family });
  } catch (error) {
    if (db) await db.query('ROLLBACK'); return next(error);
  } finally { db?.release(); }
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
        `SELECT id, full_name AS name, email, profile_image_url AS avatar, is_active, role, 'Admin' AS relationship
         FROM users WHERE id = $1`,
        [userId]
      );
      return res.json({ family: null, members: selfUser.rows });
    }

    const membersResult = await pool.query(
      `SELECT u.id, u.full_name AS name, u.email, u.profile_image_url AS avatar, u.is_active,
              fm.role, COALESCE(fm.relationship, 'Other') AS relationship, fm.joined_at
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

async function searchUserByEmail(req, res, next) {
  try {
    const userId = req.userId;
    const { email } = req.query || {};

    if (typeof email !== 'string' || !email.trim()) {
      throw appError('Email parameter is required.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if caller has a family
    const familyMemberRes = await pool.query(
      'SELECT family_id FROM family_members WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    const familyId = familyMemberRes.rows[0]?.family_id || null;

    // Search user by email
    const userRes = await pool.query(
      `SELECT id, full_name AS name, email, profile_image_url AS avatar, is_active, role
       FROM users
       WHERE LOWER(email) = $1 LIMIT 1`,
      [normalizedEmail]
    );

    const targetUser = userRes.rows[0];
    if (!targetUser) {
      throw appError('No registered ChoreHub user found with that email address.', 404);
    }

    if (targetUser.is_active === false) {
      throw appError('This user account is currently inactive.', 400);
    }

    // Check if target user is already in caller's family
    let isAlreadyMember = false;
    if (familyId) {
      const existingMemberRes = await pool.query(
        'SELECT id FROM family_members WHERE family_id = $1 AND user_id = $2',
        [familyId, targetUser.id]
      );
      if (existingMemberRes.rows.length > 0) {
        isAlreadyMember = true;
      }
    }

    return res.json({
      user: {
        ...targetUser,
        is_already_member: isAlreadyMember,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function addFamilyMember(req, res, next) {
  const client = await pool.connect();
  try {
    const userId = req.userId;
    const { user_id, relationship } = req.body || {};

    if (!user_id || typeof user_id !== 'string') {
      throw appError('User ID is required.');
    }

    const validRelationships = ['Mother', 'Father', 'Daughter', 'Son', 'Other'];
    const memberRelationship = validRelationships.includes(relationship) ? relationship : 'Other';

    await client.query('BEGIN');

    // Get or auto-create caller's family
    let familyRes = await client.query(
      'SELECT family_id FROM family_members WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    let familyId = familyRes.rows[0]?.family_id;

    if (!familyId) {
      // Auto create household for admin if they don't have one yet
      const callerRes = await client.query('SELECT full_name FROM users WHERE id = $1', [userId]);
      const callerName = callerRes.rows[0]?.full_name || 'My';
      const inviteCode = generateInviteCode();
      const newFamilyRes = await client.query(
        `INSERT INTO families (name, invite_code, created_by)
         VALUES ($1, $2, $3) RETURNING id`,
        [`${callerName}'s Household`, inviteCode, userId]
      );
      familyId = newFamilyRes.rows[0].id;

      await client.query(
        `INSERT INTO family_members (family_id, user_id, role, relationship)
         VALUES ($1, $2, 'admin', 'Parent')`,
        [familyId, userId]
      );
    }

    // Check target user exists and active
    const targetRes = await client.query(
      'SELECT id, full_name, is_active FROM users WHERE id = $1',
      [user_id]
    );

    const targetUser = targetRes.rows[0];
    if (!targetUser) throw appError('Target user not found.', 404);
    if (targetUser.is_active === false) throw appError('Target user account is inactive.', 400);

    // Insert or update relationship
    const changedMembership = await client.query(
      `INSERT INTO family_members (family_id, user_id, role, relationship)
       VALUES ($1, $2, 'member', $3)
       ON CONFLICT (family_id, user_id) DO UPDATE SET relationship = $3
       WHERE family_members.relationship IS DISTINCT FROM $3 RETURNING user_id`,
      [familyId, user_id, memberRelationship]
    );

    if (changedMembership.rowCount) {
      await notifyFamilyUpdate(client, familyId, userId, 'Family Update', `${targetUser.full_name} was added or updated in the household.`);
    }
    await client.query('COMMIT');
    return res.status(201).json({ message: 'Family member added successfully!' });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  createFamily,
  joinFamily,
  getMyFamily,
  searchUserByEmail,
  addFamilyMember,
};
