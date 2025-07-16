
// 📁 backend/routes/adminRoutes.js
const express = require('express');
const User = require('../models/User');
const isAdmin = require('../middleware/isAdmin');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Middleware requerido para todas las rutas
router.use(authMiddleware, isAdmin);

// PATCH /admin/users/:username/weekly-email → Cambiar preferencia de recibir mail semanal
router.patch('/admin/users/:username/weekly-email', async (req, res) => {
  const { username } = req.params;
  const { receiveWeeklyEmail } = req.body;
  if (username === 'admin') return res.status(403).json({ error: 'No se puede modificar el admin.' });
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    user.receiveWeeklyEmail = !!receiveWeeklyEmail;
    await user.save();
    res.status(200).json({ success: true, receiveWeeklyEmail: user.receiveWeeklyEmail });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar preferencia de email.' });
  }
});



// GET /admin-only → Verifica acceso de admin
router.get('/admin-only', (req, res) => {
  res.json({
    username: req.user.username,
    message: `👑 Bienvenido admin ${req.user.username}`
  });
});

// GET /admin/users → Lista todos los usuarios
router.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, { username: 1, role: 1, approved: 1, createdAt: 1, lastLogin: 1, receiveWeeklyEmail: 1 })
      .lean().sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron cargar los usuarios.' });
  }
});

// PATCH /admin/users/:username/approve → Aprobar usuario
router.patch('/admin/users/:username/approve', async (req, res) => {
  const { username } = req.params;
  if (username === 'admin') return res.status(403).json({ error: 'No se puede modificar el admin.' });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (user.approved) return res.status(400).json({ error: 'Este usuario ya fue aprobado.' });

    user.approved = true;
    await user.save();

    res.status(200).json({ success: true, approved: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al aprobar usuario.' });
  }
});

// PATCH /admin/users/:username/role → Cambiar rol
router.patch('/admin/users/:username/role', async (req, res) => {
  const { username } = req.params;
  if (username === 'admin') return res.status(403).json({ error: 'No se puede cambiar el rol del usuario admin.' });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const newRole = user.role === 'admin' ? 'user' : 'admin';
    await User.updateOne({ username }, { role: newRole });

    res.status(200).json({ success: true, role: newRole });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando rol.' });
  }
});

// DELETE /admin/users/:username → Eliminar usuario
router.delete('/admin/users/:username', async (req, res) => {
  const { username } = req.params;
  if (username === 'admin') return res.status(403).json({ error: 'No se puede eliminar el usuario admin.' });

  try {
    await User.deleteOne({ username });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando usuario.' });
  }
});

module.exports = router;
