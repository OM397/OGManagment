const express = require('express');
const router = express.Router();
const tickersController = require('../controllers/tickersController');

router.get('/tickers', tickersController.getTickers);
router.get('/search-stocks', tickersController.searchStocks);
router.post('/market-data', tickersController.getMarketData);

module.exports = router;
