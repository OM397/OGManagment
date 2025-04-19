const twelveData = require('../services/twelveDataService');
const yahooFinance = require('yahoo-finance2').default;
const path = require('path');
const fs = require('fs');
const tickersService = require('../services/tickersService');

exports.getTickers = (req, res) => {
  try {
    const cryptosPath = path.join(__dirname, '..', 'coingecko-tickers.json');
    const cryptos = fs.existsSync(cryptosPath)
      ? JSON.parse(fs.readFileSync(cryptosPath, 'utf-8'))
      : [];
    res.json({ cryptos, stocks: [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load tickers' });
  }
};

exports.searchStocks = async (req, res) => {
  const query = req.query.q;
  if (!query || query.length < 2) {
    console.log('⚠️ Consulta demasiado corta:', query);
    return res.status(400).json({ error: 'Consulta muy corta.' });
  }

  try {
    console.log('🔍 Buscando acciones con query (TwelveData):', query);
    let results = await twelveData.searchSymbol(query);
    let stocks = [];

    if (Array.isArray(results)) {
      stocks = results.map(item => ({
        symbol: item.symbol,
        description: item.description || item.instrument_name || item.symbol
      }));
    }

    // Fallback: Yahoo
    if (stocks.length === 0) {
      console.log('🔁 Fallback: Yahoo Finance');
      const fallback = await yahooFinance.search(query);
      stocks = (fallback?.quotes || [])
        .filter(item => item.symbol && item.shortname)
        .map(item => ({
          symbol: item.symbol,
          description: item.shortname
        }));
    }

    console.log(`✅ ${stocks.length} resultados procesados.`);
    res.json({ result: stocks });
  } catch (err) {
    console.error('❌ Error buscando acciones:', err.message);
    res.status(500).json({ error: 'Fallo al buscar acciones.' });
  }
};

exports.getMarketData = async (req, res) => {
  const tickers = req.body;

  if (
    !Array.isArray(tickers) ||
    !tickers.every(t => typeof t === 'object' && t.id && t.type)
  ) {
    console.log('⚠️ Market data error: formato inválido', tickers);
    return res.status(400).json({ error: 'Formato de entrada inválido. Esperado: [{ id, type }]' });
  }

  try {
    const result = await tickersService.fetchMarketData(tickers);
    res.json(result);
  } catch (err) {
    console.error("❌ Error al obtener market data:", err.message);
    res.status(500).json({ error: 'Error al obtener datos de mercado' });
  }
};
