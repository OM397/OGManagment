const twelveData = require('../services/twelveDataService');
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
      const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart`;
      const { data } = await axios.get(url, {
        params: {
          vs_currency: 'eur',
          days: 30,
          interval: 'daily'
        }
      });

      if (!data?.prices?.length) throw new Error('No crypto data received');

      history = data.prices.map(([timestamp, price]) => ({
        date: new Date(timestamp).toISOString().split('T')[0],
        price: parseFloat(price.toFixed(2))
      }));
    } else {
      try {
        const result = await twelveData.fetchTimeSeries(id, {
          period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          interval: '1d'
        });

        if (!result?.quotes?.length) throw new Error('Empty from Twelve');

        currency = result.meta?.currency || 'EUR';
        history = result.quotes
          .filter(p => p.close != null)
          .map(p => ({
            date: new Date(p.date).toISOString().split('T')[0],
            price: parseFloat(p.close.toFixed(2))
          }));
      } catch (err) {
        console.warn(`🛟 TwelveData failed for ${id}, trying Yahoo...`);

        const yahooResult = await yahooFinance.historical(id, {
          period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          interval: '1d'
        });

        history = yahooResult.map(entry => ({
          date: entry.date.toISOString().split('T')[0],
          price: parseFloat(entry.close.toFixed(2))
        }));

        currency = yahooResult[0]?.currency || 'EUR';
      }
    }

    const lastAvailableDate = history.length > 0 ? history[history.length - 1].date : 'N/A';
    console.log(`📅 Última fecha disponible para [${type}:${id}] → ${lastAvailableDate}`);

    res.json({ history, currency });
  } catch (err) {
    console.error(`❌ Error histórico (${type}:${id}):`, err.message);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
};
