// 📁 frontend/src/shared/layout/InnerApp.jsx
import React, { useState, useEffect } from 'react';
import AppLayout from '../../layouts/AppLayout';
import Dashboard from '../../pages/Dashboard';
import Assets from '../../pages/Assets';
import History from '../../pages/History';
import ChangePasswordModal from '../ChangePasswordModal';
import MailingSettingsModal from '../MailingSettingsModal';
import useMarketData from '../../features/assets/useMarketData';
import { useCategoryGroups } from '../context/CategoryGroupsContext';

export default function InnerApp({ user, onLogout }) {
  const { categoryGroups, setCategoryGroups } = useCategoryGroups();
  const [selectedView, setSelectedView] = useState('Dashboard');
  const [exchangeRates] = useState({ EUR: 1, USD: 1.1, GBP: 0.85 });
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showMailingSettingsModal, setShowMailingSettingsModal] = useState(false);
  const { marketData } = useMarketData(categoryGroups || {}, reloadTrigger);

  const handleReload = () => {
    setReloadTrigger(prev => prev + 1);
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handleMailingSettings = () => {
    setShowMailingSettingsModal(true);
  };

  const renderCurrentView = () => {
    const commonProps = {
      categoryGroups,
      marketData,
      setCategoryGroups,
      exchangeRates,
      reloadMarketData: handleReload
    };

    switch (selectedView) {
      case 'Dashboard':
        return <Dashboard {...commonProps} />;
      case 'Assets':
        return <Assets {...commonProps} />;
      case 'History':
        return <History />;
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  if (!categoryGroups) {
    return <div className="p-6 text-center">Cargando datos del usuario...</div>;
  }

  return (
    <>
      <AppLayout 
        selectedView={selectedView} 
        setSelectedView={setSelectedView}
        user={user}
        onLogout={onLogout}
        onReload={handleReload}
        onChangePassword={handleChangePassword}
        onMailingSettings={handleMailingSettings}
        categoryGroups={categoryGroups}
        marketData={marketData}
      >
        {renderCurrentView()}
      </AppLayout>

      {/* Modals */}
      {showChangePasswordModal && (
        <ChangePasswordModal 
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}
      
      {showMailingSettingsModal && (
        <MailingSettingsModal 
          onClose={() => setShowMailingSettingsModal(false)}
        />
      )}
    </>
  );
}
