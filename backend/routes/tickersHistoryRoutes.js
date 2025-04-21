// 📁 backend/routes/tickersHistoryRoutes.js
const express = require('express');
const router = express.Router();
const tickersHistoryController = require('../controllers/tickersHistoryController');
const authMiddleware = require('../middleware/authMiddleware');

// 🔓 Use authMiddleware only if you want protected access
// Example: router.get('/history', authMiddleware, tickersHistoryController.getHistoricalData);

// ✅ If public access is fine, keep it open like this:
router.get('/history', tickersHistoryController.getHistoricalData);

module.exports = router;
