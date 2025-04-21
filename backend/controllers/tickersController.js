// 📁 backend/controllers/tickersController.js

const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;
const twelveData = require('../services/twelveDataService');
const marketData = require('../services/unifiedMarketDataService');

let cachedCryptos = [];
let lastFetchTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

exports.getTickers = async (req, res) => {
  const now = Date.now();
  const query = (req.query.q || '').toLowerCase();

  try {
    // Fetch if expired
    if (!cachedCryptos.length || now - lastFetchTime > CACHE_TTL) {
      console.log('🌐 Fetching CoinGecko coin list...');
      const { data } = await axios.get('https://api.coingecko.com/api/v3/coins/list');
      cachedCryptos = data;
      lastFetchTime = now;
      console.log(`✅ Loaded ${data.length} crypto tickers`);
    }

    const result = !query
      ? cachedCryptos
      : cachedCryptos.filter(c =>
          c.name.toLowerCase().includes(query) ||
          c.symbol.toLowerCase().includes(query)
        ).slice(0, 100); // cap results for safety

    res.json({ cryptos: result, stocks: [] });
  } catch (err) {
    console.error('❌ CoinGecko fetch failed:', err.message);
    res.json({ cryptos: cachedCryptos, stocks: [] }); // fallback to cache
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
    console.error("❌ Error fetching market data:", err.message);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
};
