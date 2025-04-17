// 📁 backend/services/tickersHistoryService.js
const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

exports.getCryptoHistory = async (id, days = 30) => {
  try {
    const { data } = await axios.get(`${COINGECKO_API}/coins/${id}/market_chart`, {
      params: {
        vs_currency: 'eur',
        days,
        interval: 'daily'
      }
    });

    const history = data.prices.map(([timestamp, price]) => ({
      date: new Date(timestamp).toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2))
    }));

    return history;
  } catch (err) {
    console.error(`❌ Error histórico cripto (${id}):`, err.message);
    return null;
  }
};

exports.getStockHistory = async (symbol) => {
  try {
    console.log(`📈 Buscando histórico stock: ${symbol}`);

    // Calcular periodo: últimos 30 días
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 30);

    const period1 = Math.floor(past.getTime() / 1000); // Unix timestamp (s)
    const period2 = Math.floor(now.getTime() / 1000);  // Unix timestamp (s)

    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval: '1d'
    });

    if (!result?.quotes?.length) {
      console.warn(`⚠️ Sin datos para [stock:${symbol}]`);
      return [];
    }

    const history = result.quotes
      .filter(quote => quote.close !== null && quote.close !== undefined)
      .map(quote => ({
        date: new Date(quote.date).toISOString().split('T')[0],
        price: parseFloat(quote.close.toFixed(2))
      }));

    console.log(`✅ Histórico ${symbol}: ${history.length} registros`);
    return history;
  } catch (err) {
    console.error(`❌ Error histórico stock (${symbol}):`, err.message);
    return null;
  }
};
