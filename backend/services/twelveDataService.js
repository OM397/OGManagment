// 📁 backend/services/twelveDataService.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_KEY = process.env.TWELVE_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';
const CACHE_DIR = path.join(__dirname, '../.cache');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

const cacheWrite = (key, data) => {
  fs.writeFileSync(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(data));
};

const cacheRead = (key) => {
  const file = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  }
  return null;
};

const fetchQuote = async (symbol) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/quote`, {
      params: {
        symbol,
        apikey: API_KEY
      }
    });

    if (data && !data.code) {
      const parsed = {
        price: parseFloat(data.price),
        currency: data.currency
      };
      cacheWrite(`quote_${symbol}`, parsed);
      return parsed;
    } else {
      throw new Error(data.message || 'Quote fetch failed');
    }
  } catch (err) {
 //   console.error(`❌ TwelveData Quote error [${symbol}]:`, err.message);
    return cacheRead(`quote_${symbol}`);
  }
};

const fetchTimeSeries = async (symbol, interval = '1day', outputsize = 30) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/time_series`, {
      params: {
        symbol,
        interval,
        outputsize,
        apikey: API_KEY
      }
    });

    if (data && !data.code && data.values) {
      const parsed = data.values.map(item => ({
        date: item.datetime.split(' ')[0],
        price: parseFloat(item.close)
      })).reverse();

      cacheWrite(`history_${symbol}`, parsed);
      return parsed;
    } else {
      throw new Error(data.message || 'Time Series fetch failed');
    }
  } catch (err) {
 //   console.error(`❌ TwelveData History error [${symbol}]:`, err.message);
    return cacheRead(`history_${symbol}`);
  }
};

const searchSymbol = async (query) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/symbol_search`, {
      params: {
        symbol: query,
        apikey: API_KEY
      }
    });

    if (data && data.data) {
      return data.data.map(item => ({
        symbol: item.symbol,
        description: item.instrument_name
      }));
    } else {
      return [];
    }
  } catch (err) {
   // console.error(`❌ TwelveData Search error [${query}]:`, err.message);
    return [];
  }
};

module.exports = {
  fetchQuote,
  fetchTimeSeries,
  searchSymbol
};
