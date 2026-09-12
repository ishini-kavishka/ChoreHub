const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const userColumns = 'id, full_name, email, phone, profile_image_url, role, created_at, updated_at';
const appError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

function validImageUrl(value) {
  if (value === null) return true;
  if (typeof value !== 'string' || value.length > 2048) return false;
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:'; } catch { return false; }
}

async function getProfile(req, res, next) {
  try {
    const result = await pool.query(`SELECT ${userColumns} FROM users WHERE id = $1`, [req.userId]);
    if (!result.rows[0]) throw appError('User not found.', 404);
    return res.json({ user: result.rows[0] });
  } catch (error) { return next(error); }
}

async function updateProfile(req, res, next) {
  try {
    const body = req.body || {};
    const hasName = Object.hasOwn(body, 'full_name'); const hasPhone = Object.hasOwn(body, 'phone'); const hasImage = Object.hasOwn(body, 'profile_image_url');
    if (!hasName && !hasPhone && !hasImage) throw appError('Provide at least one editable profile field.');
    const fullName = hasName && typeof body.full_name === 'string' ? body.full_name.trim() : undefined;
    const phone = hasPhone && typeof body.phone === 'string' ? body.phone.trim() : body.phone;
    if (hasName && (!fullName || fullName.length > 100)) throw appError('Full name is required and must be 100 characters or fewer.');
    if (hasPhone && phone !== null && (typeof phone !== 'string' || phone.length > 20)) throw appError('Phone number must be 20 characters or fewer.');
    if (hasImage && !validImageUrl(body.profile_image_url)) throw appError('Profile image URL must be a valid HTTP(S) URL.');
    const result = await pool.query(
      `UPDATE users SET
        full_name = CASE WHEN $1 THEN $2 ELSE full_name END,
        phone = CASE WHEN $3 THEN $4 ELSE phone END,
        profile_image_url = CASE WHEN $5 THEN $6 ELSE profile_image_url END,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING ${userColumns}`,
      [hasName, fullName, hasPhone, phone, hasImage, body.profile_image_url, req.userId],
    );
    if (!result.rows[0]) throw appError('User not found.', 404);
    return res.json({ user: result.rows[0] });
  } catch (error) { return next(error); }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string') throw appError('Current password is required.');
    if (typeof newPassword !== 'string' || newPassword.length < 8) throw appError('New password must be at least 8 characters.');
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    if (!result.rows[0]) throw appError('User not found.', 404);
    if (!(await bcrypt.compare(currentPassword, result.rows[0].password_hash))) throw appError('Current password is incorrect.', 401);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, req.userId]);
    return res.json({ message: 'Password updated successfully.' });
  } catch (error) { return next(error); }
}

async function updateProfileImage(req, res, next) {
  try {
    const { profile_image_url } = req.body || {};
    if (!validImageUrl(profile_image_url)) throw appError('Profile image URL must be a valid HTTP(S) URL.');
    const result = await pool.query('UPDATE users SET profile_image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING ' + userColumns, [profile_image_url, req.userId]);
    if (!result.rows[0]) throw appError('User not found.', 404);
    return res.json({ user: result.rows[0] });
  } catch (error) { return next(error); }
}

module.exports = { getProfile, updateProfile, changePassword, updateProfileImage };
