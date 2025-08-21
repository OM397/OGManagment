// 📁 backend/services/twelveDataService.js
const axios = require('axios');
const redisClient = require('../redisClient');
require('dotenv').config();

const API_KEY = process.env.TWELVE_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';

// Redis-based cache functions
const cacheWrite = async (key, data) => {
  try {
    const cacheKey = `twelve_data:${key}`;
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    // 5 minute TTL for TwelveData responses
    await redisClient.set(cacheKey, JSON.stringify(cacheData), 'EX', 300);
  //  console.log(`✅ TwelveData cached: ${key}`);
  } catch (error) {
    console.warn('⚠️ TwelveData cache write failed:', error.message);
  }
};

const cacheRead = async (key) => {
  try {
    const cacheKey = `twelve_data:${key}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.data;
    }
    return null;
  } catch (error) {
    console.warn('⚠️ TwelveData cache read failed:', error.message);
    return null;
  }
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
      await cacheWrite(`quote_${symbol}`, parsed);
      return parsed;
    }
    throw new Error(data?.message || 'Quote fetch failed');
  } catch (err) {
    return await cacheRead(`quote_${symbol}`);
  }
};

// Accepts either (symbol, '1day', 30) or (symbol, { interval, outputsize, period1 })
const fetchTimeSeries = async (symbol, optsOrInterval = '1day', outputsize = 30) => {
  // Normalize options
  let interval = '1day';
  let size = 30;
  if (typeof optsOrInterval === 'object' && optsOrInterval !== null) {
    interval = optsOrInterval.interval || '1day';
    // Allow shorthand '1d'
    if (interval === '1d') interval = '1day';
    // Prefer explicit outputsize; otherwise if period1 present, default to 30
    size = optsOrInterval.outputsize || (optsOrInterval.period1 ? 30 : 30);
  } else {
    interval = optsOrInterval || '1day';
    if (interval === '1d') interval = '1day';
    size = outputsize || 30;
  }

  try {
    const { data } = await axios.get(`${BASE_URL}/time_series`, {
      params: {
        symbol,
        interval,
        outputsize: size,
        apikey: API_KEY
      }
    });

    if (data && !data.code && Array.isArray(data.values)) {
      const quotes = data.values
        .map(item => ({
          date: (item.datetime || item.date || '').toString().split(' ')[0],
          close: parseFloat(item.close)
        }))
        .filter(p => p.date && isFinite(p.close))
        .reverse();

      const meta = { currency: (data.meta && data.meta.currency) || data.currency };
      const payload = { quotes, meta };
      await cacheWrite(`history_${symbol}`, payload);
      return payload;
    }
    throw new Error(data?.message || 'Time Series fetch failed');
  } catch (err) {
    // Fallback to cache (normalized)
    return await cacheRead(`history_${symbol}`);
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
      // Filter results to match query by symbol, ISIN, or name
      const q = query.toLowerCase();
      return data.data
        .filter(item =>
          item.symbol?.toLowerCase().includes(q) ||
          item.instrument_name?.toLowerCase().includes(q) ||
          item.isin?.toLowerCase?.().includes(q)
        )
        .map(item => ({
          symbol: item.symbol,
          isin: item.isin,
          description: item.instrument_name
        }));
    }
    return [];
  } catch (err) {
    return [];
  }
};

module.exports = {
  fetchQuote,
  fetchTimeSeries,
  searchSymbol
};
