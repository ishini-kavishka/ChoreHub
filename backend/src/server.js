require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { pool, ensureAuthSchema } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.use(cors()); // React Native has no browser-origin constraint during local development.
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => res.json({ message: 'ChoreHub API is running' }));
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database health check failed:', error.message);
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;
if (require.main === module) {
  const server = app.listen(port, () => console.log(`ChoreHub API listening on port ${port}`));

  if (process.env.DATABASE_URL) {
    ensureAuthSchema()
      .then(() => console.log('Neon database connected'))
      .catch((error) => console.error('Database connection failed:', error.message));
  }

  server.on('error', (error) => console.error('HTTP server error:', error.message));
}
module.exports = app;
