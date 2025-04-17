const express = require('express');
const router = express.Router();
const tickersHistoryController = require('../controllers/tickersHistoryController');

// GET /api/history?id=bitcoin&type=crypto
router.get('/history', tickersHistoryController.getHistoricalData);

module.exports = router;
