// 📁 frontend/src/shared/layout/InnerApp.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import Topbar from '../Topbar';
import Portfolio from '../../features/portfolio/Portfolio';
import useMarketData from '../../features/assets/useMarketData';
import { useCategoryGroups } from '../context/CategoryGroupsContext';
import History from '../../pages/History';

export default function InnerApp({ user, onLogout }) {
  const { categoryGroups } = useCategoryGroups();
  const [selected, setSelected] = useState('Assets');
  const [exchangeRates] = useState({ EUR: 1, USD: 1.1, GBP: 0.85 });
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const { marketData } = useMarketData(categoryGroups || {}, reloadTrigger);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleSetSelected = (name) => {
    setSelected(name);
    if (isMobile) setShowSidebar(false);
  };

  const handleReload = () => {
    setReloadTrigger(prev => prev + 1);
  };

  if (!categoryGroups) {
    return <div className="p-6 text-center">Cargando datos del usuario...</div>;
  }

  return (
    <div className="h-screen md:min-h-screen flex flex-col md:flex-row overflow-hidden">
      {(showSidebar || !isMobile) && (
        <div className="md:block w-full md:w-auto">
          <Sidebar
            selected={selected}
            setSelected={handleSetSelected}
            totalValue={totalValue}
            categoryGroups={categoryGroups}
            marketData={marketData}
          />
        </div>
      )}

      <main className="flex-1 px-2 sm:px-4 md:px-8 py-4 bg-white overflow-y-auto">
        <div className="max-w-full sm:max-w-5xl mx-auto">
          <Topbar
            user={user}
            onLogout={onLogout}
            onReload={handleReload}
            onToggleSidebar={() => setShowSidebar(prev => !prev)}
          />

          {selected === 'Assets' && (
            <Portfolio
              initialData={categoryGroups}
              exchangeRates={exchangeRates}
              reloadMarketData={reloadTrigger}
            />
          )}

          {selected === 'Net Worth' && (
            <History />
          )}
        </div>
      </main>
    </div>
  );
}
