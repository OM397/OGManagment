// 📁 backend/middleware/isAdmin.js
// This middleware assumes authMiddleware ran before and populated req.user

module.exports = function isAdmin(req, res, next) {
  // ✅ Allow public access to historical GET (legacy behavior kept)
  if (req.method === 'GET' && req.originalUrl.startsWith('/api/history')) {
    return next();
  }

  // Prefer the user decoded by authMiddleware (supports accessToken cookie or Bearer header)
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'No autenticado.' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores.' });
  }

  return next();
};
