// 📁 backend/routes/adminMailingRoutes.js
const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const authMiddleware = require('../middleware/authMiddleware');
const { sendWeeklySummary } = require('../weeklyEmailJob');

// Solo admin autenticado puede ejecutar mailing manual
router.post('/manual-mailing', authMiddleware, isAdmin, async (req, res) => {
  try {
    await sendWeeklySummary();
    res.json({ success: true, message: 'Mailing ejecutado correctamente.' });
  } catch (err) {
    console.error('Error ejecutando mailing manual:', err);
    res.status(500).json({ error: 'Error al ejecutar el mailing.' });
  }
});

module.exports = router;
