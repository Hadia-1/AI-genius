// =============================================================
//  src/routes/authRoutes.js
// =============================================================

const express = require('express');
const { login, refresh, logout } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/refresh  –  silent token refresh
router.post('/refresh', refresh);

// POST /api/auth/logout
router.post('/logout', logout);

module.exports = router;
