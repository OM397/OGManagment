const express = require('express');
const router = express.Router();
const tickersController = require('../controllers/tickersController');
const marketSummaryController = require('../controllers/marketSummaryController');
const { getFxRates } = require('../controllers/tickersController');

router.get('/tickers', tickersController.getTickers);
router.get('/search-stocks', tickersController.searchStocks);
router.post('/market-data', tickersController.getMarketData);
router.get('/market-summary', marketSummaryController.getMarketSummary);
router.post('/market-summary/clear-cache', marketSummaryController.clearCache);
router.get('/fx', getFxRates);

module.exports = router;
