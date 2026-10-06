require('dotenv').config();

const cors = require('cors');
const express = require('express');

const { pool, ensureAuthSchema } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const choreRoutes = require('./routes/choreRoutes');
const familyRoutes = require('./routes/familyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const progressRoutes = require('./routes/progressRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoutes');

const {
  notFound,
  errorHandler,
} = require('./middleware/errorMiddleware');

const app = express();

// =========================================================
// Middleware
// =========================================================
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// =========================================================
// Root Route
// =========================================================
app.get('/', (_req, res) => {
  res.json({
    message: 'ChoreHub API is running',
  });
});

// =========================================================
// Health Check
// =========================================================
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      database: 'connected',
    });
  } catch (error) {
    console.error(
      'Database health check failed:',
      error.message
    );

    res.status(503).json({
      status: 'degraded',
      database: 'unavailable',
    });
  }
});

// =========================================================
// API Routes
// =========================================================
app.use('/api/auth', authRoutes);

app.use('/api/profile', profileRoutes);

app.use('/api/chores', choreRoutes);

app.use('/api/families', familyRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api/chore-time-requests', require('./routes/choreTimeRequestRoutes'));

app.use('/api/reminders', require('./routes/reminderRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/admin/component04', require('./routes/adminComponent04Routes'));

app.use('/api/progress', progressRoutes);

app.use('/api/settings', settingsRoutes);

app.use('/api/support/tickets', supportTicketRoutes);

// =========================================================
// Error Handling
// =========================================================
app.use(notFound);
app.use(errorHandler);

// =========================================================
// Server
// =========================================================
const port = Number(process.env.PORT) || 5000;

if (require.main === module) {
  const server = app.listen(port, () => {
    console.log(`ChoreHub API listening on port ${port}`);
  });

  if (process.env.DATABASE_URL) {
    ensureAuthSchema()
      .then(() => {
        console.log('Neon database connected');
      })
      .catch((error) => {
        console.error(
          'Database connection failed:',
          error.message
        );
      });
  }

  server.on('error', (error) => {
    console.error(
      'HTTP server error:',
      error.message
    );
  });
}

module.exports = app;