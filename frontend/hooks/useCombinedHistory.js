// 📁 hooks/useCombinedHistory.js
import { useEffect, useState } from 'react';
import { GRAYS } from '../src/features/history/constants';

function getCurrencyRate(id, currency, exchangeRates) {
  const fallbackCurrency = exchangeRates?.[id]?.currency || currency || 'EUR';
  return fallbackCurrency === 'EUR' ? 1 : exchangeRates?.[fallbackCurrency] || 1;
}

function normalizeCryptoId(id, type) {
  if (type !== 'crypto') return id;
  const map = {
    bitcoin: 'BTC',
    ethereum: 'ETH'
  };
  return map[id.toLowerCase()] || id.toUpperCase();
}

export default function useCombinedHistory(assets = [], exchangeRates = {}) {
  const [combinedHistory, setCombinedHistory] = useState([]);
  const [convertedInitial, setConvertedInitial] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMissingData, setHasMissingData] = useState(false);
  const [multiHistory, setMultiHistory] = useState([]);

  useEffect(() => {
    if (!assets.length) return;

    let isCancelled = false;
    setLoading(true);
    setHasMissingData(false);

    const fetchAll = async () => {
      const all = await Promise.all(
        assets.map(async ({ id, name, type, initialQty, initialCost }, index) => {
          let usedCache = false;
          let history = [];
          let convertedInitial = 0;
          const normalizedId = normalizeCryptoId(id, type);

          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/history?id=${normalizedId}&type=${type}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (!res.ok) throw new Error();
            const data = await res.json();

            const rate = getCurrencyRate(id, data.currency, exchangeRates);

            history = data.history.map(entry => ({
              date: entry.date,
              value: parseFloat((entry.price * rate * initialQty).toFixed(2))
            }));

            convertedInitial = parseFloat((initialQty * initialCost).toFixed(2));

            localStorage.setItem(`history-cache-${id}`, JSON.stringify({ history: data.history, currency: data.currency }));
          } catch {
            const cached = localStorage.getItem(`history-cache-${id}`);
            if (cached) {
              usedCache = true;
              const parsed = JSON.parse(cached);
              const rate = getCurrencyRate(id, parsed.currency, exchangeRates);

              history = parsed.history.map(entry => ({
                date: entry.date,
                value: parseFloat((entry.price * rate * initialQty).toFixed(2))
              }));

              convertedInitial = parseFloat((initialQty * initialCost * rate).toFixed(2));
            }
          }

          return {
            id,
            name,
            color: GRAYS[index % GRAYS.length],
            history,
            convertedInitial,
            usedCache
          };
        })
      );

      if (isCancelled) return;

      const allDates = new Set();
      all.forEach(asset => {
        asset.history.forEach(h => allDates.add(h.date));
      });
      let sortedDates = Array.from(allDates).sort();

      const startDates = all.map(asset => asset.history[0]?.date).filter(Boolean);
      const minStart = startDates.length ? startDates.sort()[startDates.length - 1] : null;

      if (minStart) {
        sortedDates = sortedDates.filter(d => d >= minStart);
      }

      const filledAssets = all.map(asset => {
        const map = new Map(asset.history.map(h => [h.date, h.value]));
        const filled = [];
        let lastValue = 0;

        for (const date of sortedDates) {
          if (map.has(date)) lastValue = map.get(date);
          filled.push({ date, value: lastValue });
        }

        return {
          ...asset,
          history: filled
        };
      });

      const combined = sortedDates.map((date, i) => ({
        date,
        value: parseFloat(
          filledAssets.reduce((sum, asset) => sum + asset.history[i].value, 0).toFixed(2)
        )
      }));

      const totalInitial = filledAssets.reduce((sum, a) => sum + a.convertedInitial, 0);
      const hasCache = filledAssets.some(a => a.usedCache);

      setCombinedHistory(combined);
      setConvertedInitial(parseFloat(totalInitial.toFixed(2)));
      setMultiHistory(filledAssets);
      setHasMissingData(hasCache);
      setLoading(false);
    };

    fetchAll();
    return () => { isCancelled = true; };
  }, [JSON.stringify(assets), JSON.stringify(exchangeRates)]);

  return {
    history: combinedHistory,
    convertedInitial,
    loading,
    hasMissingData,
    multiHistory
  };
}
