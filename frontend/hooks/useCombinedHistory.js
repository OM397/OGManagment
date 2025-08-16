
// 📁 hooks/useCombinedHistory.js
import { useState, useEffect } from 'react';
import { API_BASE } from '../src/shared/config';
import { CRYPTO_ID_ALIASES } from '../src/shared/cryptoIdAliases';

// Paleta de grises para los gráficos
const GRAYS = [
  '#888888', '#AAAAAA', '#CCCCCC', '#555555', '#BBBBBB', '#999999', '#444444', '#DDDDDD', '#222222', '#EEEEEE'
];

// Normaliza el id de cripto usando el alias si existe
function normalizeCryptoId(id, type) {
  if (type === 'crypto' && CRYPTO_ID_ALIASES[id?.toLowerCase()]) {
    return CRYPTO_ID_ALIASES[id.toLowerCase()];
  }
  return id;
}

export default function useCombinedHistory(assets, exchangeRates, days) {
  const [combinedHistory, setCombinedHistory] = useState([]);
  const [convertedInitial, setConvertedInitial] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMissingData, setHasMissingData] = useState(false);
  const [multiHistory, setMultiHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchAll() {
      try {
        const all = await Promise.all(
          assets.map(async (asset, index) => {
            const {
              id,
              name,
              type,
              symbol,
              initialQty,
              initialCost,
              initialDate,
              actualValue,
              actualValueEUR,
              conversionRate,
              currency,
              ...rest
            } = asset;
            let usedCache = false;
            let history = [];
            let convertedInitial = 0;
            const normalizedId = normalizeCryptoId(id, type);
            let rate = currency === 'EUR' ? 1 : (typeof conversionRate === 'number' ? conversionRate : 1);
            rate = Number(rate).toFixed(8) * 1;

            try {
              const res = await fetch(`${API_BASE}/history?id=${normalizedId}&type=${type}&days=${days}`, {
                credentials: 'include'
              });
              if (!res.ok) throw new Error();
              const data = await res.json();
              history = data.history.map(entry => {
                const price = entry.price;
                const qty = initialQty;
                const curr = currency || 'EUR';
                let convRate = curr === 'EUR' ? 1 : (typeof conversionRate === 'number' ? conversionRate : 1);
                convRate = Number(convRate).toFixed(8) * 1;
                const convertedPrice = price * convRate;
                const convertedValue = convertedPrice * qty;
                return {
                  date: entry.date,
                  price,
                  currency: curr,
                  conversionRate: Number(convRate).toFixed(8),
                  qty,
                  convertedPrice: parseFloat(convertedPrice.toFixed(2)),
                  convertedValue: parseFloat(convertedValue.toFixed(2)),
                  value: parseFloat(convertedValue.toFixed(2))
                };
              });
              convertedInitial = parseFloat((initialQty * initialCost * rate).toFixed(2));
              localStorage.setItem(`history-cache-${type}-${id}-${days}`, JSON.stringify({ history: data.history, currency: data.currency }));
            } catch {
              const cached = localStorage.getItem(`history-cache-${type}-${id}-${days}`);
              if (cached) {
                usedCache = true;
                const parsed = JSON.parse(cached);
                history = parsed.history.map(entry => {
                  const price = entry.price;
                  const qty = initialQty;
                  const curr = currency || 'EUR';
                  const convRate = curr === 'EUR' ? 1 : (typeof conversionRate === 'number' ? conversionRate : 1);
                  const convertedPrice = price * convRate;
                  const convertedValue = convertedPrice * qty;
                  return {
                    date: entry.date,
                    price,
                    currency: curr,
                    conversionRate: convRate,
                    qty,
                    convertedPrice: parseFloat(convertedPrice.toFixed(2)),
                    convertedValue: parseFloat(convertedValue.toFixed(2)),
                    value: parseFloat(convertedValue.toFixed(2))
                  };
                });
                convertedInitial = parseFloat((initialQty * initialCost * rate).toFixed(2));
              } else {
                history = Array.from({ length: days }, (_, i) => {
                  const today = new Date();
                  today.setDate(today.getDate() - ((days - 1) - i));
                  const date = today.toISOString().split('T')[0];
                  return {
                    date,
                    price: 0,
                    currency: currency || 'EUR',
                    conversionRate: Number(1).toFixed(8),
                    qty: initialQty,
                    convertedPrice: 0,
                    convertedValue: 0,
                    value: 0
                  };
                });
                convertedInitial = 0;
              }
            }

            return {
              ...asset,
              color: GRAYS[index % GRAYS.length],
              history,
              convertedInitial,
              usedCache
            };
          })
        );

        if (isCancelled) return;

        const nonEmpty = all.filter(a => Array.isArray(a.history) && a.history.length > 0);
        const today = new Date();
        const sortedDates = Array.from({ length: days }, (_, i) => {
          const d = new Date(today);
          d.setDate(d.getDate() - ((days - 1) - i));
          return d.toISOString().split('T')[0];
        });

        const filledAssets = nonEmpty.map(asset => {
          const map = new Map(asset.history.map(h => [h.date, h]));
          const filled = [];
          let lastHist = null;
          for (const date of sortedDates) {
            if (map.has(date)) lastHist = map.get(date);
            if (lastHist) {
              filled.push({ ...lastHist });
            } else {
              filled.push({ date, value: null });
            }
          }
          return {
            ...asset,
            history: filled
          };
        });

        const combined = sortedDates.map((date, i) => {
          let sum = 0;
          let hasAny = false;
          filledAssets.forEach(asset => {
            const v = asset.history[i].value;
            if (v != null) { sum += v; hasAny = true; }
          });
          return {
            date,
            value: hasAny ? parseFloat(sum.toFixed(2)) : null
          };
        });

        const firstValidIndex = combined.findIndex(p => p.value != null);
        const trimmedCombined = firstValidIndex > 0 ? combined.slice(firstValidIndex) : combined;
        const trimmedFilledAssets = filledAssets.map(a => ({
          ...a,
          history: firstValidIndex > 0 ? a.history.slice(firstValidIndex) : a.history
        }));

        const totalInitial = filledAssets.reduce((sum, a) => sum + a.convertedInitial, 0);
        const hasCache = filledAssets.some(a => a.usedCache);

        setCombinedHistory(trimmedCombined);
        setConvertedInitial(parseFloat(totalInitial.toFixed(2)));
        setMultiHistory(trimmedFilledAssets);
        setHasMissingData(hasCache);
        setLoading(false);
        setError(null);
      } catch (err) {
        setError('No se pudo cargar el historial de activos. Intenta más tarde o revisa la conexión.');
        setCombinedHistory([]);
        setConvertedInitial(0);
        setMultiHistory([]);
        setHasMissingData(false);
        setLoading(false);
      }
    }
    fetchAll();
    return () => { isCancelled = true; };
  }, [JSON.stringify(assets), JSON.stringify(exchangeRates), days]);

  return {
    history: combinedHistory,
    convertedInitial,
    loading,
    hasMissingData,
    multiHistory,
    error
  };
}
