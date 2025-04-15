import React, { useState, useEffect } from 'react';
import AssetsSummary from '../assets/AssetsSummary';
import GroupManager from '../assets/GroupManager';
import AssetGroupList from '../assets/AssetGroupList';
import useMarketData from '../assets/useMarketData';
import { CATEGORIES } from '../../shared/config';
import { useCategoryGroups } from '../../shared/context/CategoryGroupsContext';
import { formatter } from '../../shared/utils';

export default function Portfolio({ initialData, exchangeRates }) {
  const [activeTab, setActiveTab] = useState('Investments');
  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [reloadMarketData, setReloadMarketData] = useState(0);
  const [lastAddedGroupName, setLastAddedGroupName] = useState(null);
  const [lastRenamedGroupName, setLastRenamedGroupName] = useState(null);
  const [lastAddedAssetId, setLastAddedAssetId] = useState(null);

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
    setReloadMarketData(prev => prev + 1);
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
    setReloadMarketData(prev => prev + 1);
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
        const { initialQty = 0, actualCost, id } = asset;
        const marketPrice =
          actualCost ??
          marketData?.cryptos?.[id]?.eur ??
          marketData?.stocks?.[id]?.eur ??
          0;

        total += initialQty * marketPrice;
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
            const total = getCategoryTotal(cat);
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
      </div>

      {marketDataError && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          ❌ {marketDataError}
        </div>
      )}

      <GroupManager
        activeTab={activeTab}
        showAddInvestment={showAddInvestment}
        setShowAddInvestment={setShowAddInvestment}
        onAddGroup={handleAddGroup}
        onAddAsset={(asset) => setLastAddedAssetId(asset.id)}
        lastAddedAssetId={lastAddedAssetId}
        setLastAddedAssetId={setLastAddedAssetId}
      />

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
      />
    </div>
  );
}
