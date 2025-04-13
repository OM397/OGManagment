// 📁 backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const isAdmin = require('../middleware/isAdmin');

// GET /admin-only → verificar acceso
router.get('/admin-only', isAdmin, (req, res) => {
  res.json({
    username: req.user.username,
    message: `Bienvenido admin ${req.user.username}`
  });
});

// GET /admin/users → listar todos los usuarios
router.get('/admin/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

// PATCH /admin/users/:username/role → alternar rol entre user/admin
router.patch('/admin/users/:username/role', isAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();

    res.json({ success: true, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando rol' });
  }
});

// DELETE /admin/users/:username → eliminar usuario
router.delete('/admin/users/:username', isAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOneAndDelete({ username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ success: true, message: `Usuario ${username} eliminado` });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
