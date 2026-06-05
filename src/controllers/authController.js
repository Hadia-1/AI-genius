// =============================================================
//  src/controllers/authController.js
//
//  POST /api/auth/login     – credential check → issue tokens
//  POST /api/auth/refresh   – silent refresh via httpOnly cookie
//  POST /api/auth/logout    – invalidate refresh token
// =============================================================

const bcrypt = require('bcryptjs');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  buildTokenPayload,
} = require('../config/jwt');
const {
  findUserByEmail,
  findUserById,
  saveRefreshToken,
  findRefreshToken,
  removeRefreshToken,
} = require('../models/db');

// -----------------------------------------------------------------
//  Helper: calculate refresh-token expiry as a Date object
//  so we can store it in the whitelist for validation.
// -----------------------------------------------------------------
function getRefreshTokenExpiry() {
  const days = parseInt(process.env.JWT_REFRESH_EXPIRES_IN, 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

// -----------------------------------------------------------------
//  Helper: shared cookie options
// -----------------------------------------------------------------
function refreshCookieOptions() {
  return {
    httpOnly: true,                          // not accessible via JS
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',                      // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,        // 7 days in ms
    path: '/api/auth',                       // scoped to auth routes
  };
}

// =================================================================
//  LOGIN
// =================================================================
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // --- Basic input validation ---
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required.',
      });
    }

    // --- Find user ---
    const user = findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      // Use a generic message to avoid user-enumeration
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials.',
      });
    }

    // --- Compare password (bcrypt timing-safe) ---
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials.',
      });
    }

    // --- Build payload (no sensitive fields) ---
    const payload = buildTokenPayload(user);

    // --- Issue tokens ---
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // --- Persist refresh token in whitelist ---
    saveRefreshToken(refreshToken, user.id, getRefreshTokenExpiry());

    // --- Set refresh token in secure httpOnly cookie ---
    res.cookie('refreshToken', refreshToken, refreshCookieOptions());

    // --- Return access token in response body ---
    return res.status(200).json({
      status: 'success',
      message: 'Login successful.',
      accessToken,          // client stores this in memory (NOT localStorage)
      user: payload,
    });
  } catch (err) {
    next(err);
  }
}

// =================================================================
//  SILENT REFRESH
// =================================================================
async function refresh(req, res, next) {
  try {
    // --- Read refresh token from secure cookie ---
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({
        status: 'error',
        code: 'NO_REFRESH_TOKEN',
        message: 'Refresh token not found. Please log in again.',
      });
    }

    // --- Verify JWT signature & expiry ---
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      // Token invalid or expired – clear the stale cookie
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({
        status: 'error',
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh token is invalid or has expired. Please log in again.',
      });
    }

    // --- Check whitelist (token rotation protection) ---
    const storedToken = findRefreshToken(token);
    if (!storedToken) {
      // Token already used or revoked – possible replay attack
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({
        status: 'error',
        code: 'REFRESH_TOKEN_REVOKED',
        message: 'Refresh token has been revoked. Please log in again.',
      });
    }

    // --- Check whitelist expiry ---
    if (new Date() > storedToken.expiresAt) {
      removeRefreshToken(token);
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({
        status: 'error',
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired. Please log in again.',
      });
    }

    // --- Find user (ensure they still exist & role hasn't changed) ---
    const user = findUserById(decoded.id);
    if (!user) {
      removeRefreshToken(token);
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({
        status: 'error',
        message: 'User no longer exists.',
      });
    }

    // --- Token rotation: remove old, issue new pair ---
    removeRefreshToken(token);

    const payload = buildTokenPayload(user);
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    saveRefreshToken(newRefreshToken, user.id, getRefreshTokenExpiry());
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions());

    return res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully.',
      accessToken: newAccessToken,
    });
  } catch (err) {
    next(err);
  }
}

// =================================================================
//  LOGOUT
// =================================================================
async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      removeRefreshToken(token);
    }
    res.clearCookie('refreshToken', { path: '/api/auth' });

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh, logout };
