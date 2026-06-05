// =============================================================
//  src/middleware/authMiddleware.js
//
//  protect       – verifies the Bearer access token
//  restrictTo    – RBAC factory: restricts route to given roles
// =============================================================

const { verifyAccessToken } = require('../config/jwt');

// -----------------------------------------------------------------
//  protect middleware
//  Reads Authorization: Bearer <token>, verifies it, attaches
//  the decoded payload to req.user.
// -----------------------------------------------------------------
function protect(req, res, next) {
  try {
    // 1. Extract the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.',
      });
    }

    // 2. Isolate the raw token string
    const token = authHeader.split(' ')[1];

    // 3. Verify signature & expiry – throws on failure
    const decoded = verifyAccessToken(token);

    // 4. Attach safe payload to request (id, email, role)
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired. Please refresh your token.',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        code: 'TOKEN_INVALID',
        message: 'Invalid token. Authentication failed.',
      });
    }
    // Unexpected error
    next(err);
  }
}

// -----------------------------------------------------------------
//  restrictTo  –  RBAC middleware factory
//  Usage:  router.get('/admin-only', protect, restrictTo('Admin'), handler)
// -----------------------------------------------------------------
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required before authorization check.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: `Access denied. Required role(s): [${roles.join(', ')}]. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
}

module.exports = { protect, restrictTo };
