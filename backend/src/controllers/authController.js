const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/generateToken');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userColumns = 'id, full_name, email, phone, profile_image_url, role, is_active, created_at, updated_at';
const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';
const validPassword = (password) => typeof password === 'string' && password.length >= 8;
const appError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

function serializeUser(user) {
  const { password_hash: _passwordHash, is_active: _isActive, ...safeUser } = user;
  return safeUser;
}

async function signUp(req, res, next) {
  try {
    const { full_name, email, password, phone } = req.body || {};
    const fullName = typeof full_name === 'string' ? full_name.trim() : '';
    const normalizedEmail = normalizeEmail(email);
    if (fullName.length < 1 || fullName.length > 100) throw appError('Full name is required and must be 100 characters or fewer.');
    if (!EMAIL_PATTERN.test(normalizedEmail)) throw appError('A valid email address is required.');
    if (!validPassword(password)) throw appError('Password must be at least 8 characters.');
    if (phone !== undefined && (typeof phone !== 'string' || phone.trim().length > 20)) throw appError('Phone number must be 20 characters or fewer.');
    if (process.env.NODE_ENV !== 'production') console.log('Signup request received', { email: normalizedEmail, full_name: fullName });

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING ${userColumns}`,
      [fullName, normalizedEmail, passwordHash, phone?.trim() || null],
    );
    const user = serializeUser(result.rows[0]);
    if (process.env.NODE_ENV !== 'production') console.log('User inserted successfully', { id: user.id, email: user.email });
    return res.status(201).json({ user, token: generateToken(user.id) });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Signup failed:', error.message);
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    if (!EMAIL_PATTERN.test(normalizedEmail) || typeof password !== 'string') throw appError('Email and password are required.');
    const result = await pool.query(`SELECT ${userColumns}, password_hash FROM users WHERE email = $1`, [normalizedEmail]);
    const user = result.rows[0];
    const matches = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!user || !matches || !user.is_active) throw appError('Invalid email or password.', 401);
    const safeUser = serializeUser(user);
    return res.json({ user: safeUser, token: generateToken(user.id) });
  } catch (error) { return next(error); }
}

async function forgotPassword(req, res, next) {
  const genericResponse = { message: 'If an account matches that email, password reset instructions will be sent.' };
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    if (!EMAIL_PATTERN.test(normalizedEmail)) throw appError('A valid email address is required.');
    const result = await pool.query('SELECT id FROM users WHERE email = $1 AND is_active = TRUE', [normalizedEmail]);
    const user = result.rows[0];
    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
      [user.id, tokenHash],
    );
    // An email provider belongs here. Never expose this token outside development.
    if (process.env.NODE_ENV === 'development') genericResponse.devResetToken = rawToken;
    return res.json(genericResponse);
  } catch (error) { return next(error); }
}

async function resetPassword(req, res, next) {
  const client = await pool.connect();
  try {
    const { token, newPassword } = req.body || {};
    if (typeof token !== 'string' || token.length < 32) throw appError('A valid reset token is required.');
    if (!validPassword(newPassword)) throw appError('New password must be at least 8 characters.');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await client.query('BEGIN');
    const resetResult = await client.query(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND used = FALSE AND expires_at > NOW()
       FOR UPDATE`, [tokenHash],
    );
    const resetRecord = resetResult.rows[0];
    if (!resetRecord) throw appError('This reset token is invalid or has expired.', 400);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await client.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, resetRecord.user_id]);
    await client.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [resetRecord.id]);
    await client.query('COMMIT');
    return res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally { client.release(); }
}

function logout(_req, res) {
  // JWTs are stateless: clients must discard their locally stored token to log out.
  return res.json({ message: 'Logged out. Remove the JWT from client storage.' });
}

module.exports = { signUp, login, forgotPassword, resetPassword, logout };
