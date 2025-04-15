// 📁 frontend/src/shared/layout/InnerApp.jsx
import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import Topbar from '../Topbar';
import Portfolio from '../../features/portfolio/Portfolio';
import useMarketData from '../../features/assets/useMarketData';
import { useCategoryGroups } from '../context/CategoryGroupsContext';

export default function InnerApp({ user, onLogout }) {
  const { categoryGroups } = useCategoryGroups();
  const [selected, setSelected] = useState('Assets');
  const [exchangeRates] = useState({ EUR: 1, USD: 1.1, GBP: 0.85 });
  const { marketData } = useMarketData(categoryGroups || {}, 0);

  let totalValue = 0;
  Object.values(categoryGroups || {}).forEach(category => {
    if (typeof category === 'object') {
      Object.values(category).forEach(group => {
        if (Array.isArray(group)) {
          group.forEach(asset => {
            const price =
              marketData?.cryptos?.[asset.id]?.eur ||
              marketData?.stocks?.[asset.id]?.eur || 0;
            totalValue += (asset.initialQty || 0) * price;
          });
        }
      });
    }
  });

  if (!categoryGroups) {
    return <div className="p-6 text-center">Cargando datos del usuario...</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar selected={selected} setSelected={setSelected} totalValue={totalValue} />
      <main className="flex-1 p-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <Topbar user={user} onLogout={onLogout} />
          {selected === 'Assets' && (
            <Portfolio initialData={categoryGroups} exchangeRates={exchangeRates} />
          )}
        </div>
      </main>
    </div>
  );
}
