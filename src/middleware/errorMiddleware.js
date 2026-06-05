// =============================================================
//  src/middleware/errorMiddleware.js  –  Centralized Error Handler
// =============================================================

function errorHandler(err, req, res, next) {  // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  return res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    // Only expose stack trace in development
    ...(isDev && { stack: err.stack }),
  });
}

// Convenience helper for throwing structured errors from controllers
function createError(message, statusCode = 500) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

module.exports = { errorHandler, createError };
