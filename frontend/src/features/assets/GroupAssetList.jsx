// 📁 frontend/src/features/assets/GroupAssetList.jsx
import React from 'react';
import AssetCard from './AssetCard';

const ITEMS_PER_PAGE = 10;

export default function GroupAssetList({
  groupName,
  assets,
  page,
  setPage,
  marketData,
  exchangeRates,
  onDeleteAsset,
  activeTab,
  lastAddedAssetId,
  onDropAsset
}) {
  const totalPages = Math.ceil(assets.length / ITEMS_PER_PAGE);
  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const visibleAssets = assets.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleDrop = (e) => {
    e.preventDefault();
    const assetData = JSON.parse(e.dataTransfer.getData('application/json'));
    onDropAsset(assetData.groupName, groupName, assetData.assetIndex);
  };

  const allowDrop = (e) => {
    e.preventDefault();
  };

  return (
    <div
      onDragOver={allowDrop}
      onDrop={handleDrop}
      className="min-h-[48px] py-2 space-y-4"
    >
      {visibleAssets.length > 0 ? (
        visibleAssets.map((asset, idx) => (
          <AssetCard
            key={`${groupName}-${startIdx + idx}-${asset.name}`}
            asset={asset}
            marketData={marketData}
            exchangeRates={exchangeRates}
            onDelete={() => onDeleteAsset(groupName, startIdx + idx)}
            activeTab={activeTab}
            groupName={groupName}
            assetIndex={startIdx + idx}
            isHighlighted={asset.id?.toLowerCase() === lastAddedAssetId?.toLowerCase()}
          />
        ))
      ) : (
        <div className="text-sm text-gray-400 italic px-4 py-2 text-center">
          Arrastra aquí para mover un asset
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 px-2 text-sm">
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(groupName, page - 1)}
              className={`px-3 py-1 rounded ${
                page === 1 ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white'
              }`}
            >
              Anterior
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(groupName, page + 1)}
              className={`px-3 py-1 rounded ${
                page === totalPages ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white'
              }`}
            >
              Siguiente
            </button>
          </div>
          <div className="text-gray-600">
            Página {page} de {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
