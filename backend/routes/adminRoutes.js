// 📁 backend/routes/adminRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const isAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token no proporcionado' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'No eres admin' });

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido (verificación)' });
  }
};

router.get('/admin-only', isAdmin, (req, res) => {
  res.json({ message: `Bienvenido admin ${req.user.username}` });
});

module.exports = router;
