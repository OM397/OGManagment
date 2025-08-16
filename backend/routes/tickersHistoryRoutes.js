// 📁 backend/routes/tickersHistoryRoutes.js
const express = require('express');
const router = express.Router();
const tickersHistoryController = require('../controllers/tickersHistoryController');
const authMiddleware = require('../middleware/authMiddleware');

// 🔓 Use authMiddleware only if you want protected access
// Example: router.get('/history', authMiddleware, tickersHistoryController.getHistoricalData);

// ✅ Public access; explicitly set Cache-Control for short-term caching
router.get('/history', (req, res, next) => {
	res.set('Cache-Control', 'public, max-age=60');
	next();
}, tickersHistoryController.getHistoricalData);

module.exports = router;
