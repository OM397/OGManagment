// 📁 testApis.js
const yahoo = require('yahoo-finance2').default;
const axios = require('axios');
const FINNHUB_API_KEY = 'cvki541r01qu5brovlv0cvki541r01qu5brovlvg';
const TWELVE_API_KEY = '701e13bdbbfe4a97990ed84d7b619ccb';

async function testProviders(symbol = 'AAPL') {
  const results = {};

  // TwelveData
  try {
    const twelve = await axios.get('https://api.twelvedata.com/quote', {
        params: { symbol, apikey: TWELVE_API_KEY }
      });
      
      if (twelve.data?.status === 'error') {
        results.twelveData = `❌ ${twelve.data.message}`;
      } else {
        results.twelveData = {
          price: twelve.data?.price,
          currency: twelve.data?.currency
        };
      }
  } catch (err) {
    results.twelveData = `❌ ${err.message}`;
  }

  // Yahoo Finance
  try {
    const yahooData = await yahoo.quote(symbol);
    results.yahoo = { price: yahooData.regularMarketPrice, currency: yahooData.currency };
  } catch (err) {
    results.yahoo = `❌ ${err.message}`;
  }

  // Finnhub
  try {
    const finnhub = await axios.get('https://finnhub.io/api/v1/quote', {
      params: { symbol, token: FINNHUB_API_KEY }
    });
    results.finnhub = { price: finnhub.data?.c, currency: 'USD' };
  } catch (err) {
    results.finnhub = `❌ ${err.message}`;
  }

  console.table(results);
}

testProviders();

