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
  try {
    fs.writeFileSync(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(data));
  } catch (_) {}
};

const cacheRead = (key) => {
  try {
    const file = path.join(CACHE_DIR, `${key}.json`);
    if (!fs.existsSync(file)) return null;
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
    // Backward-compat: if cache is an array of {date, price}, wrap into {quotes, meta}
    if (Array.isArray(parsed)) {
      return { quotes: parsed.map(p => ({ date: p.date, close: p.price })), meta: {} };
    }
    // If already in new format, return as is
    if (parsed && parsed.quotes) return parsed;
    return null;
  } catch (_) {
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
      cacheWrite(`quote_${symbol}`, parsed);
      return parsed;
    }
    throw new Error(data?.message || 'Quote fetch failed');
  } catch (err) {
    return cacheRead(`quote_${symbol}`);
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
      cacheWrite(`history_${symbol}`, payload);
      return payload;
    }
    throw new Error(data?.message || 'Time Series fetch failed');
  } catch (err) {
    // Fallback to cache (normalized)
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
