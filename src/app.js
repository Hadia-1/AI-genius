// =============================================================
//  src/app.js  –  Express application factory
// =============================================================

const express = require('express');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// -----------------------------------------------------------------
//  Global Middleware
// -----------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// -----------------------------------------------------------------
//  Routes
// -----------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AI-Genius API is running',
    version: '1.0.0',
    endpoints: {
      auth: {
        login:   'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout:  'POST /api/auth/logout',
      },
      ai: {
        freeModel:    'GET    /api/ai/free-model',
        premiumModel: 'POST   /api/ai/premium-model',
        purgeCache:   'DELETE /api/ai/purge-cache',
      },
    },
    testCredentials: {
      admin:        { email: 'admin@aigenius.com',   password: 'Admin@1234' },
      premiumUser:  { email: 'premium@aigenius.com', password: 'Premium@1234' },
      freeUser:     { email: 'free@aigenius.com',    password: 'Free@1234' },
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// -----------------------------------------------------------------
//  404 handler
// -----------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.originalUrl} not found.` });
});

// -----------------------------------------------------------------
//  Centralized error handler  (must be last)
// -----------------------------------------------------------------
app.use(errorHandler);

module.exports = app;
