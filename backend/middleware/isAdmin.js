// 📁 backend/middleware/isAdmin.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function isAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token faltante.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso restringido a administradores.' });
    }
    req.user = decoded.username;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido.' });
  }
};
