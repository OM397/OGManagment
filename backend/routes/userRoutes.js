// 📁 backend/routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ✅ Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// GET /user-data → obtener los datos de usuario
router.get('/user-data', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const { password, ...safeData } = user.toObject();
    res.status(200).json({ data: safeData.data });
  } catch (err) {
    res.status(500).json({ error: 'Error al leer datos.' });
  }
});

// POST /user-data → guardar datos personalizados
router.post('/user-data', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (!req.body?.data) return res.status(400).json({ error: 'Falta el objeto data.' });

    user.data = req.body.data;
    await user.save();

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo guardar la data del usuario.' });
  }
});

// GET /user → obtener datos básicos del usuario autenticado
router.get('/user', (req, res) => {
  const { username, role } = req.user || {};
  if (!username || !role) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  res.status(200).json({ username, role });
});

// POST /change-password → cambiar contraseña
router.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 5) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 5 caracteres.' });
  }

  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Contraseña actual incorrecta.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando la contraseña.' });
  }
});

module.exports = router;
