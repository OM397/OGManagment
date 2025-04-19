// 📁 backend/services/tickersService.js
const twelveData = require('./twelveDataService');
const yahooFinance = require('yahoo-finance2').default;
const finnhubService = require('./finnhubService');
const axios = require('axios');

exports.fetchMarketData = async (assets) => {
  const result = { cryptos: {}, stocks: {} };
  const exchangeRates = {};
  const currencies = new Set();

  for (const { id, type } of assets) {
    if (!id || !type) continue;

    if (type === 'crypto') {
      try {
        const cgRes = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
          params: { ids: id.toLowerCase(), vs_currencies: 'eur' }
        });
        if (cgRes.data[id]) {
          result.cryptos[id.toLowerCase()] = cgRes.data[id];
        }
      } catch (err) {
        console.error(`❌ CoinGecko error [${id}]:`, err.message);
      }
    }

    if (type === 'stock') {
      let quote;
      const cleanSymbol = id.toUpperCase().split('.')[0];

      try {
        quote = await twelveData.fetchQuote(cleanSymbol);
      } catch (err) {
        console.error(`❌ TwelveData error [${cleanSymbol}]:`, err.message);
      }

      if (!quote?.price) {
        try {
          const fallback = await yahooFinance.quote(id.toUpperCase());
          if (fallback?.regularMarketPrice) {
            quote = {
              price: fallback.regularMarketPrice,
              currency: fallback.currency?.toUpperCase() || 'EUR'
            };
          }
        } catch (err) {
          console.warn(`❌ Yahoo fallback failed. Trying Finnhub for ${id}`);
          try {
            quote = await finnhubService.getQuote(id.toUpperCase());
          } catch (finnhubErr) {
            console.error(`❌ Finnhub quote failed for ${id}:`, finnhubErr.message);
          }
        }
      }

      if (quote?.price) {
        let price = quote.price;
        let currency = (quote.currency || 'EUR').toUpperCase();

        if (currency === 'GBX') {
          price /= 100;
          currency = 'GBP';
        }
        if (currency === 'GBP' && price > 1000) {
          price /= 100;
        }

        currencies.add(currency);
        result.stocks[id.toLowerCase()] = { rawPrice: price, currency };
      }
    }
  }

  if (currencies.size > 0) {
    try {
      const symbols = Array.from(currencies).filter(c => c !== 'EUR').join(',');
      const ratesRes = await axios.get('https://api.frankfurter.app/latest', {
        params: { from: 'EUR', to: symbols }
      });
      Object.assign(exchangeRates, ratesRes.data?.rates);
    } catch (err) {
      console.error('❌ FX rate fetch failed:', err.message);
    }
  }

  for (const [id, data] of Object.entries(result.stocks)) {
    let { rawPrice, currency } = data;
    let eurPrice = rawPrice;
    let rate = 1;

    if (currency !== 'EUR' && exchangeRates[currency]) {
      rate = exchangeRates[currency];
      eurPrice = rawPrice / rate;
    }

    result.stocks[id].eur = Math.round(eurPrice * 1000) / 1000;
    result.stocks[id].conversionRate = rate;
  }

  return result;
};
