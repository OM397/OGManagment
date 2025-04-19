const twelveData = require('./twelveDataService');
const yahooFinance = require('yahoo-finance2').default;
const axios = require('axios');

exports.fetchMarketData = async (assets) => {
  const result = { cryptos: {}, stocks: {} };
  const exchangeRates = {};
  const currencies = new Set();

  for (const { id, type } of assets) {
    if (!id || !type) continue;

    if (type === 'crypto') {
      console.log(`📤 Intentando cripto: ${id}`);
      try {
        const cgRes = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
          params: { ids: id.toLowerCase(), vs_currencies: 'eur' }
        });
        if (cgRes.data[id]) {
          result.cryptos[id.toLowerCase()] = cgRes.data[id];
          console.log(`📥 Cripto encontrada: ${id} → €${cgRes.data[id].eur}`);
        }
      } catch (err) {
        console.error(`❌ Error buscando cripto ${id}:`, err.message);
      }
    }

    if (type === 'stock') {
      console.log(`📤 Intentando stock (TwelveData): ${id}`);
      let quote;
      const cleanSymbol = id.toUpperCase().split('.')[0];

      try {
        quote = await twelveData.fetchQuote(cleanSymbol);
      } catch (err) {
        console.error(`❌ TwelveData Quote error [${cleanSymbol}]:`, err.message);
      }

      if (!quote || !quote.price) {
        try {
          const fallback = await yahooFinance.quote(id.toUpperCase());
          if (fallback?.regularMarketPrice) {
            quote = {
              price: fallback.regularMarketPrice,
              currency: (fallback.currency || 'EUR').toUpperCase()
            };
            console.log(`🛟 Yahoo fallback used for: ${id}`);
          }
        } catch (fallbackErr) {
          console.error(`❌ Yahoo fallback failed for ${id}:`, fallbackErr.message);
        }
      }

      if (quote?.price) {
        let price = quote.price;
        let currency = (quote.currency || 'EUR').toUpperCase();

        if (currency === 'GBX') {
          price = price / 100;
          currency = 'GBP';
          console.log(`🔁 Convertido GBX → GBP: ${price} GBP`);
        }

        if (currency === 'GBP' && price > 1000) {
          price = price / 100;
          console.log(`🔁 Precio ajustado de GBP peniques a libras: ${price}`);
        }

        currencies.add(currency);

        result.stocks[id.toLowerCase()] = { rawPrice: price, currency };
      } else {
        console.warn(`❌ No se encontró precio para ${id}`);
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
      console.log('💱 Tasas de cambio obtenidas:', exchangeRates);
    } catch (err) {
      console.error('❌ Error al obtener tasas de cambio:', err.message);
    }
  }

  const debugTable = [];

  for (const [id, data] of Object.entries(result.stocks)) {
    let { rawPrice, currency } = data;
    let eurPrice = rawPrice;
    let rate = 1;

    if (currency !== 'EUR' && exchangeRates[currency]) {
      rate = exchangeRates[currency];
      eurPrice = rawPrice / rate;
      console.log(`💶 ${id}: Precio en EUR usando 1 ${currency} = €${1 / rate} → €${eurPrice}`);
    }

    result.stocks[id].eur = Math.round(eurPrice * 1000) / 1000;
    result.stocks[id].conversionRate = rate;
    debugTable.push({ id, rawPrice, currency, rate, eurPrice: result.stocks[id].eur });
  }

  console.table(debugTable);
  return result;
};
