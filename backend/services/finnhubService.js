// 📁 backend/services/finnhubService.js
const axios = require('axios');
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

exports.getQuote = async (symbol) => {
  const { data } = await axios.get(`https://finnhub.io/api/v1/quote`, {
    params: { symbol, token: FINNHUB_API_KEY }
  });
  return data?.c ? { price: data.c, currency: 'USD' } : null;
};

exports.getHistory = async (symbol) => {
  const now = Math.floor(Date.now() / 1000);
  const from = now - 30 * 86400;

  const { data } = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
    params: {
      symbol,
      resolution: 'D',
      from,
      to: now,
      token: FINNHUB_API_KEY
    }
  });

  if (data?.c?.length) {
    return data.c.map((price, i) => ({
      date: new Date(data.t[i] * 1000).toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2))
    }));
  }

  return [];
};
