// 📁 frontend/features/portfolio/Portfolio.jsx
import React, { useState, useEffect } from 'react';
import AssetsSummary from '../assets/AssetsSummary';
import GroupManager from '../assets/GroupManager';
import AssetGroupList from '../assets/AssetGroupList';
import useMarketData from '../assets/useMarketData';
import { CATEGORIES } from '../../shared/config';
import { useCategoryGroups } from '../../shared/context/CategoryGroupsContext';
import { formatter } from '../../shared/utils';
import { calculateTotals } from '../../shared/calculateAssetTotals';


export default function Portfolio({ initialData, exchangeRates, reloadMarketData }) {
  const [activeTab, setActiveTab] = useState('Investments');
  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [lastAddedGroupName, setLastAddedGroupName] = useState(null);
  const [lastRenamedGroupName, setLastRenamedGroupName] = useState(null);
  const [lastAddedAssetId, setLastAddedAssetId] = useState(null);
  const [allExpanded, setAllExpanded] = useState(true);

  const { categoryGroups, setCategoryGroups } = useCategoryGroups();
  const normalizedGroups = categoryGroups[activeTab] || {};
  const { marketData, error: marketDataError } = useMarketData(categoryGroups, reloadMarketData);

  const handleAddGroup = (name) => {
    if (!name.trim()) return;

    setCategoryGroups(prev => {
      const updated = { ...prev };
      const groups = updated[activeTab] || {};

      if (!groups[name]) {
        groups[name] = [];
        updated[activeTab] = groups;
        setLastAddedGroupName(name);
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

  useEffect(() => {
    for (const category of CATEGORIES) {
      const currentGroups = categoryGroups[category] || {};
      const initialGroups = initialData?.[category] || {};

      for (const groupName in currentGroups) {
        const newAssets = currentGroups[groupName] || [];
        const oldAssets = initialGroups[groupName] || [];

        if (newAssets.length > oldAssets.length) {
          const addedAsset = newAssets.find(
            newAsset => !oldAssets.some(oldAsset =>
              oldAsset.name === newAsset.name &&
              oldAsset.id === newAsset.id &&
              oldAsset.initialCost === newAsset.initialCost &&
              oldAsset.initialQty === newAsset.initialQty
            )
          );
          if (addedAsset) {
            setLastAddedAssetId(addedAsset.id);
            return;
          }
        }
      }
    }
  }, [categoryGroups, initialData]);

  const getCategoryTotal = (categoryKey) => {
    let total = 0;
    const groups = categoryGroups?.[categoryKey] || {};
  
    Object.values(groups).forEach(group => {
      group.forEach(asset => {
        const { initialQty = 0, actualCost, manualValue, id, type } = asset;
  
        const price =
          type === 'manual'
            ? manualValue ?? 0


            : actualCost ?? marketData?.cryptos?.[id]?.eur ?? marketData?.stocks?.[id]?.eur ?? 0;
  
        total += initialQty * price;
      });
    });
  
    return total;
  };
  

  return (
    <div className="px-4 sm:px-6 md:px-8">
      <AssetsSummary
        activeTab={activeTab}
        groups={Object.keys(normalizedGroups)}
        initialData={categoryGroups}
        marketData={marketData}
        exchangeRates={exchangeRates}
      />

      <div className="overflow-x-auto mb-6">
        <div className="flex gap-4 border-b border-gray-200 text-sm font-medium min-w-[500px]">
          {CATEGORIES.map(cat => {
            const isActive = activeTab === cat;
            const { totalActual: total } = calculateTotals(categoryGroups, marketData, cat === 'Investments');

            const totalDisplay = total > 0 ? formatter.format(total) : '€€€€';

            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`pb-2 min-w-[100px] sm:min-w-[150px] flex-1 transition-colors duration-200 flex flex-col items-center text-center ${
                  isActive
                    ? 'text-black border-b-2 border-black font-semibold'
                    : 'text-gray-400 hover:text-black'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-xs ${isActive ? 'text-black' : 'text-gray-400'}`}>
                  {totalDisplay}
                </span>
              </button>
            );
          })}
        </div>
      </div>,
    


      <GroupManager
        activeTab={activeTab}
        showAddInvestment={showAddInvestment}
        setShowAddInvestment={setShowAddInvestment}
        onAddGroup={handleAddGroup}
        onAddAsset={(asset) => setLastAddedAssetId(asset.id)}
        lastAddedAssetId={lastAddedAssetId}
        setLastAddedAssetId={setLastAddedAssetId}
      />

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
        lastRenamedGroupName={lastRenamedGroupName}
        allExpanded={allExpanded}
      />
    </div>
  );
}
