// 📁 frontend/components/TestMarketHistory.js
import React from 'react';
import useMarketHistory from '../hooks/useMarketHistory';

export default function TestMarketHistory() {
  const { history, loading } = useMarketHistory('bitcoin', 'crypto', 1, 100);

  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <h2>Crypto History (BTC)</h2>
      {history.map(h => (
        <div key={h.date}>{h.date}: €{h.value}</div>
      ))}
    </div>
  );
}
