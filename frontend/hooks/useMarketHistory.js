// 📁 hooks/useMarketHistory.js
import { useState, useEffect } from 'react';
import { API_BASE } from '../src/shared/config';

function getCurrencyRate(id, currency, exchangeRates) {
  const fallbackCurrency = exchangeRates?.[id]?.currency || currency || 'EUR';
  return fallbackCurrency === 'EUR' ? 1 : exchangeRates?.[fallbackCurrency] || 1;
}

export default function useMarketHistory(id, type, initialQty = 1, initialCost = 0, exchangeRates = {}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [convertedInitial, setConvertedInitial] = useState(null);
  const [usedCache, setUsedCache] = useState(false);

  useEffect(() => {
    if (!id || !type || id.length < 2) return;

    const controller = new AbortController();
    const signal = controller.signal;
    const cacheKey = `history-cache-${id}`;

    const fetchData = async () => {
      try {
        setLoading(true);
        setUsedCache(false);

        const res = await fetch(`${API_BASE}/history?id=${id}&type=${type}`, {
          credentials: 'include',
          signal
        });

        if (!res.ok) throw new Error(`Error ${res.status}`);

        const data = await res.json();
        if (!Array.isArray(data?.history)) throw new Error('Invalid data');

        const rate = getCurrencyRate(id, data.currency, exchangeRates);

        const investmentHistory = data.history.map(entry => ({
          date: entry.date,
          value: parseFloat((entry.price * rate * initialQty).toFixed(2))
        }));

        setHistory(investmentHistory);
        localStorage.setItem(cacheKey, JSON.stringify({ history: data.history, currency: data.currency, timestamp: Date.now() }));
      } catch (err) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          console.warn(`⚠️ Cargando histórico desde cache: ${id}`);
          const parsed = JSON.parse(cached);
          const rate = getCurrencyRate(id, parsed.currency, exchangeRates);

          const fallback = parsed.history.map(entry => ({
            date: entry.date,
            value: parseFloat((entry.price * rate * initialQty).toFixed(2))
          }));

          setHistory(fallback);
          setUsedCache(true);
        } else {
          setHistory([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [id, type, initialQty, JSON.stringify(exchangeRates)]);

  useEffect(() => {
    if (!id || !initialCost || !initialQty) return;

    const currency = exchangeRates?.[id]?.currency || 'EUR';
    const rate = currency === 'EUR' ? 1 : exchangeRates?.[currency] || 1;

    const converted = parseFloat((initialCost * initialQty).toFixed(2));
    setConvertedInitial(converted);
  }, [initialCost, initialQty, exchangeRates, id, type]);

  return { history, loading, convertedInitial, usedCache };
}