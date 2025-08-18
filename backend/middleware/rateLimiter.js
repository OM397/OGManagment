// 📁 backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV !== 'production' && !isTest;

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 1500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
  skip: (req) => {
    const url = req.originalUrl || req.url || '';
    return /\/api\/(login|refresh|register|forgot-password)(\/|$)/.test(url);
  },
  handler: (req, res, next, options) => {
    if (!isDev) console.warn('[RATE-LIMIT][API]', req.ip, req.path);
    res.status(options.statusCode).json(options.message);
  }
});

// Auth-specific limiter (login/register)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación. Intenta más tarde.' },
  handler: (req, res, next, options) => {
    if (!isDev) console.warn('[RATE-LIMIT][AUTH]', req.ip, req.path);
    res.status(options.statusCode).json(options.message);
  }
});

// Refresh token limiter
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 120 : 60, // <-- subido de 20 a 60 en producción
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de renovación.' },
  handler: (req, res, next, options) => {
    if (!isDev) console.warn('[RATE-LIMIT][REFRESH]', req.ip, req.path);
    res.status(options.statusCode).json(options.message);
  }
});

module.exports = { apiLimiter, authLimiter, refreshLimiter };
