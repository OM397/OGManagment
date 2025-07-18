// 📁 backend/routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

// 🔁 Normaliza claves a MongoDB
const normalizeKeysForDB = (data) => ({
  Investments: data?.Investments || {},
  RealEstate: data?.['Real Estate'] || data?.RealEstate || {},
  Others: data?.Others || {}
});

// 🔁 Convierte claves para el frontend
const normalizeKeysForClient = (data) => ({
  Investments: data?.Investments || {},
  'Real Estate': data?.RealEstate || data?.['Real Estate'] || {},
  Others: data?.Others || {}
});

// 📥 GET /user-data → obtener data normalizada
router.get('/user-data', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const safe = normalizeKeysForClient(user.data);
    res.status(200).json({ data: safe });
  } catch (err) {
    res.status(500).json({ error: 'Error al leer datos.' });
  }
});

// 💾 POST /user-data → guardar datos normalizados
router.post('/user-data', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (!req.body?.data) {
      return res.status(400).json({ error: 'Falta el objeto data.' });
    }

    user.data = normalizeKeysForDB(req.body.data);
    await user.save();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo guardar la data del usuario.' });
  }
});

// 👤 GET /user → datos básicos
router.get('/user', (req, res) => {
  const { username, role } = req.user || {};
  if (!username || !role) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  res.status(200).json({ username, role });
});

// 🔑 POST /change-password
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

// 📧 GET /email-preference → obtener preferencia de email
router.get('/email-preference', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username }).select('receiveWeeklyEmail');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    res.status(200).json({ 
      receiveWeeklyEmail: !!user.receiveWeeklyEmail,
      timestamp: Date.now() // Para debugging y cache busting
    });
  } catch (err) {
    console.error('Error al obtener preferencia de email:', err);
    res.status(500).json({ error: 'Error al obtener preferencia de email.' });
  }
});

// 📧 POST /email-preference → cambiar preferencia de email
router.post('/email-preference', async (req, res) => {
  try {
    const { receiveWeeklyEmail } = req.body;
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const oldValue = user.receiveWeeklyEmail;
    user.receiveWeeklyEmail = !!receiveWeeklyEmail;
    await user.save();

    console.log(`[EMAIL PREF] Usuario ${req.user.username}: ${oldValue} → ${user.receiveWeeklyEmail}`);

    res.status(200).json({ 
      success: true, 
      receiveWeeklyEmail: user.receiveWeeklyEmail,
      message: user.receiveWeeklyEmail ? 'Activado el resumen semanal por email' : 'Desactivado el resumen semanal por email',
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Error al actualizar preferencia de email:', err);
    res.status(500).json({ error: 'Error al actualizar preferencia de email.' });
  }
});

module.exports = router;
