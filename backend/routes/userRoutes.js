// 📁 backend/routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

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

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  const visible = local[0];
  return `${visible}${'*'.repeat(Math.max(1, Math.min(4, local.length - 1)))}` + '@' + domain;
}

// 📥 GET /user-data → obtener data normalizada por uid
router.get('/user-data', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ publicId: req.user.uid });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const safe = normalizeKeysForClient(user.data);
    res.status(200).json({ data: safe });
  } catch (err) {
    res.status(500).json({ error: 'Error al leer datos.' });
  }
});

// 💾 POST /user-data → guardar datos normalizados
router.post('/user-data', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ publicId: req.user.uid });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (!req.body?.data) {
      return res.status(400).json({ error: 'Falta el objeto data.' });
    }

    // Detectar y añadir initialCurrency automáticamente a cada inversión
    const normalized = normalizeKeysForDB(req.body.data);
    const marketData = require('../services/unifiedMarketDataService');
    if (normalized.Investments && typeof normalized.Investments === 'object') {
      for (const [groupName, investments] of Object.entries(normalized.Investments)) {
        if (!Array.isArray(investments)) continue;
        for (const inv of investments) {
          if (!inv.initialCurrency && inv.id && inv.type) {
            try {
              const historyData = await marketData.fetchHistory(inv.id, inv.type, 30);
              if (historyData && historyData.currency) {
                inv.initialCurrency = historyData.currency;
              }
            } catch (e) {
              // Si falla, no asigna initialCurrency
            }
          }
        }
      }
    }
    user.data = normalized;
    await user.save();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo guardar la data del usuario.' });
  }
});

// 👤 GET /user → datos básicos
router.get('/user', authMiddleware, async (req, res) => {
  const { uid, role } = req.user || {};
  if (!uid || !role) return res.status(401).json({ error: 'Token inválido' });
  try {
    const user = await User.findOne({ publicId: uid }).select('username publicId');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.status(200).json({ uid, role, maskedEmail: maskEmail(user.username) });
  } catch (e) {
    return res.status(500).json({ error: 'Error obteniendo usuario.' });
  }
});

// 🔑 POST /change-password
router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 5) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 5 caracteres.' });
  }

  try {
  const user = await User.findOne({ publicId: req.user.uid });
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
router.get('/email-preference', authMiddleware, async (req, res) => {
  try {
  const user = await User.findOne({ publicId: req.user.uid }).select('receiveWeeklyEmail');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    res.status(200).json({ 
      receiveWeeklyEmail: !!user.receiveWeeklyEmail,
  timestamp: Date.now() // Para cache busting
    });
  } catch (err) {
  // ...existing code...
    res.status(500).json({ error: 'Error al obtener preferencia de email.' });
  }
});

// 📧 POST /email-preference → cambiar preferencia de email
router.post('/email-preference', authMiddleware, async (req, res) => {
  try {
    const { receiveWeeklyEmail } = req.body;
  const user = await User.findOne({ publicId: req.user.uid });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const oldValue = user.receiveWeeklyEmail;
    user.receiveWeeklyEmail = !!receiveWeeklyEmail;
    await user.save();

  // ...existing code...

    res.status(200).json({ 
      success: true, 
      receiveWeeklyEmail: user.receiveWeeklyEmail,
      message: user.receiveWeeklyEmail ? 'Activado el resumen semanal por email' : 'Desactivado el resumen semanal por email',
      timestamp: Date.now()
    });
  } catch (err) {
  // ...existing code...
    res.status(500).json({ error: 'Error al actualizar preferencia de email.' });
  }
});

module.exports = router;
