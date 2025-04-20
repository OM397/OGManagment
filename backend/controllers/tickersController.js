// 📁 backend/controllers/tickersController.js

const marketData = require('../services/unifiedMarketDataService');
const yahooFinance = require('yahoo-finance2').default;
const twelveData = require('../services/twelveDataService');
const fs = require('fs');
const path = require('path');

exports.getTickers = (req, res) => {
  try {
    const cryptosPath = path.join(__dirname, '..', 'coingecko-tickers.json');
    const cryptos = fs.existsSync(cryptosPath)
      ? JSON.parse(fs.readFileSync(cryptosPath, 'utf-8'))
      : [];
    res.json({ cryptos, stocks: [] });
  } catch (err) {
    console.error('❌ Error loading tickers:', err.message);
    res.status(500).json({ error: 'Failed to load tickers' });
  }
};

exports.searchStocks = async (req, res) => {
  const query = req.query.q;
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  try {
    console.log('🔍 Searching stocks for:', query);
    let stocks = [];

    const tdResults = await twelveData.searchSymbol(query);
    if (Array.isArray(tdResults)) {
      stocks = tdResults.map(item => ({
        symbol: item.symbol,
        description: item.description || item.instrument_name || item.symbol
      }));
    }

    if (stocks.length === 0) {
      console.log('🔁 Falling back to Yahoo Finance search');
      const fallback = await yahooFinance.search(query);
      stocks = (fallback?.quotes || [])
        .filter(item => item.symbol && item.shortname)
        .map(item => ({
          symbol: item.symbol,
          description: item.shortname
        }));
    }

    console.log(`✅ Found ${stocks.length} result(s)`);
    res.json({ result: stocks });
  } catch (err) {
    console.error('❌ Stock search error:', err.message);
    res.status(500).json({ error: 'Stock search failed' });
  }
};

exports.getMarketData = async (req, res) => {
  const tickers = req.body;

  if (!Array.isArray(tickers) || !tickers.every(t => t.id && t.type)) {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  try {
    console.log('📥 Market data request received:', tickers);
    const result = await marketData.getCurrentQuotes(tickers);
    console.log('✅ Market data response:', result);
    res.json(result);
  } catch (err) {
    console.log('🔍 FINAL MARKET DATA RESPONSE:', JSON.stringify(result, null, 2));
    console.error("❌ Error fetching market data:", err.message);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
};
