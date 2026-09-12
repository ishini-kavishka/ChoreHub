const jwt = require('jsonwebtoken');

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

module.exports = { requireAuth };
