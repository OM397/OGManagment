import React from 'react';
import InvestmentForm from '../investment/InvestmentForm';
import { useCategoryGroups } from '../../shared/context/CategoryGroupsContext';
import GroupNameInput from './GroupNameInput';
import ToggleInvestmentButton from './ToggleInvestmentButton';

export default function GroupManager({
  activeTab,
  showAddInvestment,
  setShowAddInvestment,
  onAddGroup,
  onAddAsset,
  lastAddedAssetId,
  setLastAddedAssetId
}) {
  const { categoryGroups, setCategoryGroups } = useCategoryGroups();

  const handleAddInvestment = (asset, groupName) => {
    setLastAddedAssetId?.(asset.id);
    setCategoryGroups(prev => {
      const updated = { ...prev };
      const groups = updated[activeTab] || {};
      const groupAssets = groups[groupName] || [];

      groupAssets.push(asset);
      groups[groupName] = groupAssets;
      updated[activeTab] = groups;
      return updated;
    });

    onAddAsset?.(asset);
    setShowAddInvestment(false);
  };

  return (
    <>
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-4 px-2 sm:px-0">
        <GroupNameInput onAddGroup={onAddGroup} />
        <ToggleInvestmentButton
          showAddInvestment={showAddInvestment}
          setShowAddInvestment={setShowAddInvestment}
        />
      </div>

      {showAddInvestment && (
        <InvestmentForm
          activeTab={activeTab}
          onClose={() => setShowAddInvestment(false)}
          onSubmit={handleAddInvestment}
          setLastAddedAssetId={setLastAddedAssetId}
        />
      )}
    </>
  );
}
