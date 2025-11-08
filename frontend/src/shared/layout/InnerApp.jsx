// 📁 frontend/src/shared/layout/InnerApp.jsx
import React, { useState, useEffect } from 'react';
import AppLayout from '../../layouts/AppLayout';
// import Dashboard from '../../pages/Dashboard';
import Assets from '../../pages/Assets';
import Dashboard2 from '../../pages/Dashboard2';
import RealEstateDashboard from '../../pages/RealEstateDashboard';
import ChangePasswordModal from '../ChangePasswordModal';
import MailingSettingsModal from '../MailingSettingsModal';
import useMarketData from '../../features/assets/useMarketData';
// ✅ Usar nuestro hook personalizado en lugar del del contexto
import useCategoryGroups from '../../features/assets/useCategoryGroups';

export default function InnerApp({ user, onLogout }) {
  const { categoryGroups, setCategoryGroups } = useCategoryGroups();
  // Persist selected view across refreshes (quick solution before real routing)
  const [selectedView, setSelectedView] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('lastView') : null;
      if (stored === 'History') {
        return 'Dashboard2';
      }
      return stored || 'Dashboard2';
    } catch (e) {
      return 'Dashboard2';
    }
  });
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showMailingSettingsModal, setShowMailingSettingsModal] = useState(false);
  const { marketData, exchangeRates } = useMarketData(categoryGroups || {}, reloadTrigger, {
    enableInterval: true,
  currentPriceIntervalMs: 60000,   // precios cada 60s
  fxThrottleMs: 200000,            // FX cada 200s
  fxPollMs: 200000,                // polling FX cada 200s
  startupBurstCount: 3,            // 3 bursts iniciales
  startupBurstSpacingMs: 10000     // separados 10s
  });

  // Expose the freshest marketData globally for components that read window.marketDataGlobal (e.g., chart last-point patch)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.marketDataGlobal = marketData;
      }
    } catch (_) {}
  }, [marketData]);

  // Store selection changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lastView', selectedView);
      }
    } catch (e) {
      // fail silently
    }
  }, [selectedView]);

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
        return <Dashboard2 {...commonProps} />;
      case 'Assets':
        return <Assets {...commonProps} />;
      case 'Dashboard2':
        return <Dashboard2 {...commonProps} />;
      case 'RealEstateDashboard':
        return <RealEstateDashboard {...commonProps} />; // ✅ AGREGAR props
      default:
        return <Dashboard2 {...commonProps} />;
    }
  };

  if (!categoryGroups || Object.keys(categoryGroups).length === 0) {
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