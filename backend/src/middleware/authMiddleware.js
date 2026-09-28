const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Authentication is required.' });
  if (!process.env.JWT_SECRET) return res.status(500).json({ message: 'Server authentication is not configured.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.sub) return res.status(401).json({ message: 'Invalid authentication token.' });
    req.userId = payload.sub;
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
}

async function requireAdmin(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication is required.' });
    }
    const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.userId]);
    const user = result.rows[0];
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    req.userRole = user.role;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error checking user authorization.' });
  }
}

module.exports = { requireAuth, requireAdmin };

