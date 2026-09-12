function notFound(_req, res) { res.status(404).json({ message: 'Route not found.' }); }

function errorHandler(error, _req, res, _next) {
  if (error.code === '23505') return res.status(409).json({ message: 'An account with this email already exists.' });
  if (error.code === '22P02') return res.status(400).json({ message: 'Invalid request data.' });
  if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
  console.error('Unhandled API error:', error.message);
  return res.status(500).json({ message: 'Something went wrong. Please try again.' });
}

module.exports = { notFound, errorHandler };
