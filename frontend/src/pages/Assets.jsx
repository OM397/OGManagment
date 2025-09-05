// � All Assets Management - Complete Portfolio Management
import React, { useState, useEffect } from 'react';
import AssetsSummary from '../features/assets/AssetsSummary';
import GroupManager from '../features/assets/GroupManager';
import AssetGroupList from '../features/assets/AssetGroupList';
import { CATEGORIES } from '../shared/config';
import { TabNav, Button } from '../shared/design/components';
import { calculateTotals } from '../shared/calculateAssetTotals';

export default function Assets({ 
  categoryGroups, 
  marketData, 
  setCategoryGroups,
  exchangeRates,
  reloadMarketData 
}) {
  // Usar claves consistentes: 'Investments', 'RealEstate', 'Others'
  const [activeTab, setActiveTab] = useState('Investments');

  // Si tienes tabs definidos, asegúrate de que usen estas claves:
  const TABS = [
    { id: 'Investments', label: 'Investments' },
    { id: 'RealEstate', label: 'Real Estate' },
    { id: 'Others', label: 'Others' }
  ];
  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [lastAddedGroupName, setLastAddedGroupName] = useState(null);
  const [lastRenamedGroupName, setLastRenamedGroupName] = useState(null);
  const [lastAddedAssetId, setLastAddedAssetId] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Force clear any existing highlights on component mount
  useEffect(() => {
    setLastAddedAssetId(null);
    // Mark initial load as complete after a short delay
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  const [allExpanded, setAllExpanded] = useState(true);

  // Normaliza el valor de activeTab para que coincida con la clave del estado
  const normalizedTab = activeTab;
  const normalizedGroups = categoryGroups[normalizedTab] || {};
  const assets = Object.values(normalizedGroups).flat();
  const isEmpty = Object.keys(normalizedGroups).length === 0;

  // LOG: Estado de normalizedGroups en la pestaña activa
  //.log('[Assets.jsx] normalizedGroups en', normalizedTab, ':', normalizedGroups);

  const handleCreateDefaultGroup = () => {
    const defaultName = 'General';

    handleAddGroup(defaultName);
  //  console.log('[Assets.jsx] activeTab:', activeTab);
   // console.log('[Assets.jsx] categoryGroups:', categoryGroups);
   // console.log('[Assets.jsx] normalizedGroups:', normalizedGroups);
    setLastAddedGroupName(defaultName);
    setShowAddInvestment(true);
  };

  const handleAddGroup = (name) => {
    if (!name.trim()) return;

    setCategoryGroups(prev => {
      const updated = { ...prev };
      // Asegura que la clave existe como objeto
      if (!updated[activeTab]) updated[activeTab] = {};
      const groups = updated[activeTab];

      if (!groups[name]) {
        groups[name] = [];
        updated[activeTab] = groups;
        setLastAddedGroupName(name);
        // LOG: Grupo añadido
       // console.log(`[Assets.jsx] Grupo añadido en '${activeTab}':`, name);
       // console.log('[Assets.jsx] Estado tras añadir grupo:', updated);
      }

      return updated;
    });
  };

  const handleDeleteAsset = (groupName, assetIndex) => {
    setCategoryGroups(prev => {
      const updated = { ...prev };
      const group = updated[activeTab]?.[groupName];
      if (!group) return prev;

      const newGroup = group.filter((_, idx) => idx !== assetIndex);
      updated[activeTab] = {
        ...updated[activeTab],
        [groupName]: newGroup
      };
      return updated;
    });
  };

  const handleDeleteGroup = (groupName) => {
    setCategoryGroups(prev => {
      const updated = { ...prev };
      if (!updated[activeTab]) return prev;

      const newGroups = { ...updated[activeTab] };
      delete newGroups[groupName];

      updated[activeTab] = newGroups;
      return updated;
    });
  };

  const handleRenameGroup = (oldName, newName) => {
    if (!newName || oldName === newName) return;

    setCategoryGroups(prev => {
      const updated = { ...prev };
      const currentGroups = updated[activeTab] || {};

      if (currentGroups[newName]) {
        alert(`Ya existe un grupo con el nombre "${newName}".`);
        return prev;
      }

      const assets = currentGroups[oldName];
      if (!assets) return prev;

      delete currentGroups[oldName];
      currentGroups[newName] = assets;
      updated[activeTab] = currentGroups;
      return updated;
    });

    setLastRenamedGroupName(newName);
  };

  // Detect new assets being added (only after initial load)
  useEffect(() => {
    // Skip detection during initial load
    if (isInitialLoad) return;
    
    // Simple approach: only highlight when explicitly called through onAddAsset
    // The drag & drop and other asset operations will call setLastAddedAssetId directly
  }, [categoryGroups, isInitialLoad]); // Added isInitialLoad dependency

  // Clear highlight after 3 seconds
  useEffect(() => {
    if (lastAddedAssetId) {
      const timer = setTimeout(() => {
        setLastAddedAssetId(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [lastAddedAssetId]);

  // Prepare totals for TabNav
  const tabTotals = CATEGORIES.reduce((acc, cat) => {
    const { totalActual } = calculateTotals(categoryGroups, marketData, cat);
    acc[cat] = !isNaN(Number(totalActual)) ? Number(totalActual) : 0;
    return acc;
  }, {});

  return (
  <div className="px-2 sm:px-4 py-3 sm:py-5 w-full max-w-none">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">All Assets</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-2">Complete overview of your investment portfolio</p>
      </div>

      {/* Portfolio Summary */}
      <AssetsSummary
        initialData={categoryGroups}
        marketData={marketData}
        activeTab={activeTab}
      />

      {/* Category Tabs - ¡AQUÍ ESTÁN LAS PESTAÑAS! */}
      <div className="mb-6">
        <TabNav 
          tabs={CATEGORIES}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totals={tabTotals}
          className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0"
        />
      </div>

      {/* Asset Management */}
      {isEmpty && (
        <div className="my-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Start by creating your first group</h2>
            <p className="text-gray-600 mb-4">Groups help you organize your assets. Create a group and then add your first asset.</p>
            <Button onClick={handleCreateDefaultGroup} variant="primary" size="md">
              Create "General" group
            </Button>
          </div>
        </div>
      )}
      <GroupManager
        activeTab={activeTab}
        showAddInvestment={showAddInvestment}
        setShowAddInvestment={setShowAddInvestment}
        onAddGroup={handleAddGroup}
        onAddAsset={(asset) => setLastAddedAssetId(asset.id)}
        lastAddedGroupName={lastAddedGroupName}
        lastAddedAssetId={lastAddedAssetId}
        setLastAddedAssetId={setLastAddedAssetId}
      />

      {/* Expand/Collapse All Button */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setAllExpanded(prev => !prev)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-black transition"
          title={allExpanded ? 'Colapsar todos los grupos' : 'Expandir todos los grupos'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform duration-200 ${allExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Vista por grupos restaurada */}
      {!isEmpty && (
        <AssetGroupList
          groups={normalizedGroups}
          marketData={marketData}
          exchangeRates={exchangeRates}
          onDeleteAsset={handleDeleteAsset}
          onDeleteGroup={handleDeleteGroup}
          onRenameGroup={handleRenameGroup}
          activeTab={activeTab}
          lastAddedGroupName={lastAddedGroupName}
          lastAddedAssetId={lastAddedAssetId}
          setLastAddedAssetId={setLastAddedAssetId}
          lastRenamedGroupName={lastRenamedGroupName}
          allExpanded={allExpanded}
        />
      )}
    </div>
  );
}
