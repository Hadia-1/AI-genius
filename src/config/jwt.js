// =============================================================
//  src/config/jwt.js  –  Token generation & verification helpers
// =============================================================

const jwt = require('jsonwebtoken');

// -----------------------------------------------------------------
//  Generate Access Token  (short-lived, e.g. 15 m)
// -----------------------------------------------------------------
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });
}

// -----------------------------------------------------------------
//  Generate Refresh Token  (long-lived, e.g. 7 d)
// -----------------------------------------------------------------
function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
}

// -----------------------------------------------------------------
//  Verify Access Token  – returns decoded payload or throws
// -----------------------------------------------------------------
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

// -----------------------------------------------------------------
//  Verify Refresh Token  – returns decoded payload or throws
// -----------------------------------------------------------------
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

// -----------------------------------------------------------------
//  Build the minimal, safe JWT payload  (no passwords!)
// -----------------------------------------------------------------
function buildTokenPayload(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  buildTokenPayload,
};
