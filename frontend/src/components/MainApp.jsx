// 🏠 Main Application Component
import React, { useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import Dashboard from '../pages/Dashboard';
import Assets from '../pages/Assets';
import useMarketData from '../features/assets/useMarketData';
import { useCategoryGroups } from '../shared/context/CategoryGroupsContext';

export default function MainApp({ initialData, exchangeRates, reloadMarketData }) {
  const [selectedView, setSelectedView] = useState('Dashboard');
  const { categoryGroups, setCategoryGroups } = useCategoryGroups();
  const { marketData, error: marketDataError } = useMarketData(categoryGroups, reloadMarketData);

  const renderCurrentView = () => {
    const commonProps = {
      categoryGroups,
      marketData,
      setCategoryGroups,
      exchangeRates,
      reloadMarketData
    };

    switch (selectedView) {
      case 'Dashboard':
        return <Dashboard {...commonProps} />;
      case 'Assets':
        return <Assets {...commonProps} />;
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  return (
    <AppLayout 
      categoryGroups={categoryGroups}
      marketData={marketData}
    >
      <div selectedView={selectedView} setSelectedView={setSelectedView}>
        {renderCurrentView()}
      </div>
    </AppLayout>
  );
}
