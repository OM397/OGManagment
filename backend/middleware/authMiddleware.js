// 📁 backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async function authMiddleware(req, res, next) {
  // Accept modern cookie 'accessToken', fallback to legacy 'token', or Bearer header
  const cookieToken = req.cookies?.['__Host-accessToken'] || req.cookies?.accessToken || req.cookies?.token;
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;
  const token = cookieToken || headerToken;

  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[authMiddleware] 401 sin token: cookies=', Object.keys(req.cookies||{}), 'authHeader=', !!req.headers.authorization);
    }
    return res.status(401).json({ error: 'Token faltante.', code: 'MISSING_TOKEN' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Legacy tokens (pre-migration) carried username not uid. Allow brief grace period.
    if (!decoded?.uid) {
      if (decoded?.username && decoded?.tokenId) {
        req.user = decoded; // legacy structure
        return next();
      }
  if (process.env.NODE_ENV !== 'production') console.warn('[authMiddleware] 403 legacy token sin uid/tokenId');
  return res.status(403).json({ error: 'Token inválido.' });
    }
    if (!decoded?.tokenId) {
  if (process.env.NODE_ENV !== 'production') console.warn('[authMiddleware] 403 token sin tokenId');
  return res.status(403).json({ error: 'Token inválido.' });
    }
    try {
      const redis = require('../redisClient');
      const sessionKey = `session:${decoded.uid}:${decoded.tokenId}`;
      const exists = await redis.exists(sessionKey);
      if (!exists) {
        if (process.env.NODE_ENV !== 'production') console.warn('[authMiddleware] 401 session redis missing', sessionKey);
        return res.status(401).json({ error: 'Sesión no válida.', code: 'SESSION_NOT_FOUND', requiresRefresh: true });
      }
      // Touch lastAccess (best-effort)
      try { const { updateSessionActivity } = require('../services/tokenService'); await updateSessionActivity(decoded.uid, decoded.tokenId); } catch(_) {}
    } catch (e) {
      console.warn('[authMiddleware] Redis check failed:', e.message);
    }
    req.user = decoded; // { uid, role, tokenId }
    next();
  } catch (err) {
  if (err && err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado.',
        code: 'TOKEN_EXPIRED',
        requiresRefresh: true
      });
    }
  if (process.env.NODE_ENV !== 'production') console.warn('[authMiddleware] 403 verificación JWT falló', err?.name, err?.message);
  return res.status(403).json({ error: 'Token inválido.' });
  }
};
