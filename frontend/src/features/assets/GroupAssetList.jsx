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
    <div onDragOver={allowDrop} onDrop={handleDrop} className="min-h-[48px] py-2">
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
        <div className="text-sm text-gray-400 italic px-4 py-2">Arrastra aquí para mover un asset</div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 mt-2 px-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(groupName, page - 1)}
            className={`px-2 py-1 rounded ${page === 1 ? 'bg-gray-300' : 'bg-blue-600 text-white'}`}
          >
            Anterior
          </button>
          <span className="text-sm px-2 py-1">Página {page} de {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(groupName, page + 1)}
            className={`px-2 py-1 rounded ${page === totalPages ? 'bg-gray-300' : 'bg-blue-600 text-white'}`}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
