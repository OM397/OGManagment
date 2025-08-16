// 📁 frontend/features/assets/AssetGroupList.jsx
import React, { useState, useEffect } from 'react';
import GroupHeader from './GroupHeader';
import GroupAssetList from './GroupAssetList';
import GroupSummary from './GroupSummary';
import { useCategoryGroups } from '../../shared/context/CategoryGroupsContext';

export default function AssetGroupList({
  groups,
  marketData,
  exchangeRates,
  onDeleteAsset,
  onDeleteGroup,
  activeTab,
  lastAddedGroupName,
  lastAddedAssetId,
  setLastAddedAssetId,
  lastRenamedGroupName,
  allExpanded = true
}) {
  const { setCategoryGroups } = useCategoryGroups();

  // Eliminada la persistencia de actualValue y actualValueEUR en el estado global

  const [pageByGroup, setPageByGroup] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [highlightedGroup, setHighlightedGroup] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.group-options-menu')) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (lastAddedGroupName || lastRenamedGroupName) {
      const name = lastAddedGroupName || lastRenamedGroupName;
      setHighlightedGroup(name);
      const timer = setTimeout(() => setHighlightedGroup(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastAddedGroupName, lastRenamedGroupName]);

  // Optimización: solo actualizar cuando cambie el número de grupos
  const groupCount = Object.keys(groups || {}).length;
  useEffect(() => {
    const newState = {};
    for (const name of Object.keys(groups)) {
      newState[name] = allExpanded;
    }
    setExpandedGroups(newState);
  }, [allExpanded, groupCount]);

    // LOG: Renderizando grupos en AssetGroupList
  //  console.log('[AssetGroupList.jsx] activeTab:', activeTab);
//    console.log('[AssetGroupList.jsx] groups:', groups);

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const setPage = (groupName, newPage) => {
    setPageByGroup(prev => ({ ...prev, [groupName]: newPage }));
  };

  const handleRenameGroup = (oldName, newName) => {
    const trimmed = newName?.trim();
    if (!trimmed || trimmed === oldName || groups[trimmed]) return;

    setCategoryGroups(prev => {
      const updated = { ...prev };
      const oldGroup = updated[activeTab]?.[oldName];
      if (!oldGroup) return prev;

      delete updated[activeTab][oldName];
      updated[activeTab][trimmed] = oldGroup;
      return updated;
    });

    setOpenMenu(null);
    setHighlightedGroup(trimmed);
    setTimeout(() => setHighlightedGroup(null), 1000);
  };

  const handleDropAsset = (fromGroup, toGroup, assetIndex) => {
    if (fromGroup === toGroup) return;

    setCategoryGroups(prev => {
      const updated = { ...prev };
      const fromAssets = [...updated[activeTab][fromGroup]];
      const toAssets = [...(updated[activeTab][toGroup] || [])];

      const [moved] = fromAssets.splice(assetIndex, 1);
      toAssets.push(moved);

      updated[activeTab] = {
        ...updated[activeTab],
        [fromGroup]: fromAssets,
        [toGroup]: toAssets
      };

      return updated;
    });
  };

  let categoryInitial = 0;
  let categoryActual = 0;

  return (
    <>
      {Object.entries(groups)
        .sort(([, aAssets], [, bAssets]) => {
          const getValue = (assets) =>
            assets.reduce((sum, a) => {
              const rawKey = a.id?.toLowerCase?.();
              const mapped = (a.type === 'crypto') ? marketData?.idMap?.[rawKey] : undefined;
              const key = mapped && (marketData?.cryptos?.[mapped]) ? mapped : rawKey;
              const live = a.type === 'manual'
                ? undefined
                : (marketData?.cryptos?.[key]?.eur ?? marketData?.stocks?.[key]?.eur);
              const price =
                a.type === 'manual'
                  ? a.manualValue ?? 0
                  : (live ?? a.actualCost ?? 0);
              return sum + price * (a.initialQty || 0);
            }, 0);
          return getValue(bAssets) - getValue(aAssets);
        })
        .map(([groupName, assets]) => {
          const page = pageByGroup[groupName] || 1;
          const isOpen = expandedGroups[groupName] ?? true;

          const initialValue = assets.reduce(
            (sum, a) => sum + (a.initialCost || 0) * (a.initialQty || 0),
            0
          );

const actualValue = assets.reduce((sum, a) => {
  const rawKey = a.id?.toLowerCase?.();
  const mapped = (a.type === 'crypto') ? marketData?.idMap?.[rawKey] : undefined;
  const key = mapped && (marketData?.cryptos?.[mapped]) ? mapped : rawKey;
  const live = a.type === 'manual' ? undefined : (marketData?.cryptos?.[key]?.eur ?? marketData?.stocks?.[key]?.eur);
  const price =
    a.type === 'manual'
      ? a.manualValue ?? 0
      : (live ?? a.actualCost ?? 0);

  return sum + price * (a.initialQty || 0);
}, 0);

          

          const change =
            initialValue > 0 ? ((actualValue - initialValue) / initialValue) * 100 : 0;

          const changeColor =
            change > 0
              ? 'text-green-600'
              : change < 0
              ? 'text-red-600'
              : 'text-gray-500';

          const isHighlighted = groupName === highlightedGroup;

          categoryInitial += initialValue;
          categoryActual += actualValue;

          return (
            <div key={groupName} className="mb-2 border-b border-gray-200 pb-2">
              <GroupHeader
                groupName={groupName}
                isOpen={isOpen}
                isHighlighted={isHighlighted}
                actualValue={actualValue}
                initialValue={initialValue}
                change={change}
                changeColor={changeColor}
                openMenu={openMenu}
                setOpenMenu={setOpenMenu}
                onToggleGroup={toggleGroup}
                onRenameGroup={handleRenameGroup}
                onDeleteGroup={onDeleteGroup}
                allGroupNames={Object.keys(groups)}
              />

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? 'max-h-[1000px]' : 'max-h-0'
                }`}
              >
                {isOpen && (
                  <GroupAssetList
                    groupName={groupName}
                    assets={assets}
                    page={page}
                    setPage={setPage}
                    marketData={marketData}
                    exchangeRates={exchangeRates}
                    onDeleteAsset={onDeleteAsset}
                    activeTab={activeTab}
                    lastAddedAssetId={lastAddedAssetId}
                    setLastAddedAssetId={setLastAddedAssetId}
                    onDropAsset={handleDropAsset}
                  />
                )}
              </div>
            </div>
          );
        })}

      <GroupSummary initialTotal={categoryInitial} actualTotal={categoryActual} />
    </>
  );
}
