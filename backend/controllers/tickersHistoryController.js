// 📁 backend/controllers/tickersHistoryController.js
const yahooFinance = require('yahoo-finance2').default;
const axios = require('axios');

exports.getHistoricalData = async (req, res) => {
  const { id, type } = req.query;

  if (!id || !type) {
    return res.status(400).json({ error: 'Missing id or type' });
  }

  try {
    let history = [];
    let currency = 'EUR';

    if (type === 'crypto') {
      // ✅ CoinGecko API: 30 días, intervalo diario
      const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart`;
      const { data } = await axios.get(url, {
        params: {
          vs_currency: 'eur',
          days: 30,
          interval: 'daily'
        }
      });

      if (!data?.prices?.length) {
        throw new Error('No crypto data received');
      }

      history = data.prices.map(([timestamp, price]) => ({
        date: new Date(timestamp).toISOString().split('T')[0],
        price: parseFloat(price.toFixed(2))
      }));
    } else {
      // ✅ Yahoo Finance: stocks/ETFs
      const queryOptions = {
        period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        interval: '1d'
      };

      const result = await yahooFinance.chart(id, queryOptions);
      currency = result.meta?.currency || 'EUR';

      history = result?.quotes
        ?.filter(p => p.close !== null)
        .map(p => ({
          date: new Date(p.date).toISOString().split('T')[0],
          price: parseFloat(p.close.toFixed(2))
        })) || [];
    }

    res.json({ history, currency });
  } catch (err) {
    console.error(`❌ Error histórico (${type}:${id}):`, err.message);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
};
