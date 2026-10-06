const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/generateToken');

const googleClient = new OAuth2Client();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userColumns = 'id, full_name, email, phone, profile_image_url, role, is_active, created_at, updated_at';
const appError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

async function signInWithGoogle(req, res, next) {
  try {
    const idToken = req.body?.idToken;
    if (typeof idToken !== 'string' || !idToken) {
      throw appError('A Google identity token is required.');
    }

    const audiences = (process.env.GOOGLE_CLIENT_ID || '')
      .split(',')
      .map((clientId) => clientId.trim())
      .filter(Boolean);
    if (!audiences.length) {
      throw appError('Google sign-in is not configured on the server.', 503);
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: audiences });
      payload = ticket.getPayload();
    } catch {
      throw appError('Google sign-in could not be verified. Please try again.', 401);
    }

    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const suppliedName = typeof payload?.name === 'string' ? payload.name.trim() : '';
    const name = (suppliedName || email.split('@')[0]).slice(0, 100);
    if (!emailPattern.test(email) || payload?.email_verified !== true || !name) {
      throw appError('Google did not provide a verified email address.', 401);
    }

    let result = await pool.query(
      `SELECT ${userColumns} FROM users WHERE email = $1`,
      [email],
    );
    let user = result.rows[0];

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);
      result = await pool.query(
        `INSERT INTO users (full_name, email, password_hash, profile_image_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING
         RETURNING ${userColumns}`,
        [name, email, passwordHash, payload.picture || null],
      );
      user = result.rows[0];

      if (!user) {
        result = await pool.query(
          `SELECT ${userColumns} FROM users WHERE email = $1`,
          [email],
        );
        user = result.rows[0];
      }
    }

    if (!user || !user.is_active) {
      throw appError('This ChoreHub account is not available.', 403);
    }

    const { is_active: _isActive, ...safeUser } = user;
    return res.json({ user: safeUser, token: generateToken(user.id) });
  } catch (error) {
    return next(error);
  }
}

module.exports = { signInWithGoogle };
