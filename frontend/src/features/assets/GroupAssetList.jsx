// 📁 frontend/features/assets/GroupAssetList.jsx
import React, { useState } from 'react';
import AssetCard from './AssetCard';
import { DropZoneIndicator } from '../../shared/design/dragDrop';
import { useDragDropSounds, useHapticFeedback } from '../../shared/design/notifications';

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
  setLastAddedAssetId,
  onDropAsset
}) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [isValidDrop, setIsValidDrop] = useState(true);
  
  // Enhanced feedback systems
  const { playSound } = useDragDropSounds();
  const haptic = useHapticFeedback();
  
  const totalPages = Math.ceil(assets.length / ITEMS_PER_PAGE);
  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const visibleAssets = assets.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Enhanced drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!isDropTarget) {
      setIsDropTarget(true);
      playSound('hover');
      haptic.hover();
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDropTarget(true);
    
    // Check if this is a valid drop target
    try {
      const dragData = e.dataTransfer.getData('application/json');
      if (dragData) {
        const parsed = JSON.parse(dragData);
        const isValid = parsed.groupName !== groupName;
        setIsValidDrop(isValid);
        
        if (isValid) {
          playSound('hover');
          haptic.hover();
        }
      }
    } catch {
      setIsValidDrop(true);
    }
  };

  const handleDragLeave = (e) => {
    // Only hide indicator if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDropTarget(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDropTarget(false);
    
    try {
      const assetData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (assetData.groupName !== groupName) {
        // Success feedback
        playSound('dropSuccess');
        haptic.dropSuccess();
        
        onDropAsset(assetData.groupName, groupName, assetData.assetIndex);
        
        // Highlight the moved asset
        if (setLastAddedAssetId && assetData.asset?.id) {
          setLastAddedAssetId(assetData.asset.id);
        }
        
        // Asset moved successfully
      } else {
        // Error feedback
        playSound('dropError');
        haptic.dropError();
      }
    } catch (error) {
      console.error('Drop failed:', error);
      playSound('dropError');
      haptic.dropError();
    }
  };

  const allowDrop = (e) => {
    e.preventDefault();
  };

    return (
      <div className="w-full overflow-y-auto max-h-[80vh] px-2 sm:px-0">
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="min-h-[48px] py-2 space-y-4 relative"
      >
        {/* Enhanced Drop Zone Indicator */}
        <DropZoneIndicator 
          isActive={isDropTarget} 
          isValidDrop={isValidDrop}
          groupName={groupName}
        />

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
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No hay activos en este grupo</p>
            <p className="text-xs mt-1">Arrastra un activo aquí para añadirlo</p>
          </div>
        )}
      </div>

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
