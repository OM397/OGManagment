// 🎯 Enhanced Drag & Drop Hook for Asset Management
import { useState, useCallback, useRef } from 'react';

export const useDragAndDrop = ({ onDropAsset, activeTab, setLastAddedAssetId }) => {
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedAsset: null,
    dropTarget: null,
    isValidDrop: true,
    dragPosition: { x: 0, y: 0 }
  });

  const dragStartPos = useRef({ x: 0, y: 0 });

  // 🎯 Start dragging an asset
  const handleDragStart = useCallback((e, asset, groupName, assetIndex) => {
    const dragData = {
      asset,
      groupName,
      assetIndex,
      activeTab
    };

    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';

    // Store initial position
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    // Update drag state
    setDragState({
      isDragging: true,
      draggedAsset: asset,
      dropTarget: null,
      isValidDrop: true,
      dragPosition: { x: e.clientX, y: e.clientY }
    });

    // Add drag styles to prevent text selection
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    // Custom drag image (transparent to show our custom preview)
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
  }, [activeTab]);

  // 🎯 Handle drag over target
  const handleDragOver = useCallback((e, targetGroupName) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Update drop target and validation
    setDragState(prev => {
      const isValidDrop = prev.draggedAsset && 
                         prev.dropTarget !== targetGroupName &&
                         targetGroupName !== undefined;

      return {
        ...prev,
        dropTarget: targetGroupName,
        isValidDrop,
        dragPosition: { x: e.clientX, y: e.clientY }
      };
    });
  }, []);

  // 🎯 Handle drag enter
  const handleDragEnter = useCallback((e, targetGroupName) => {
    e.preventDefault();
    
    setDragState(prev => ({
      ...prev,
      dropTarget: targetGroupName
    }));
  }, []);

  // 🎯 Handle drag leave
  const handleDragLeave = useCallback((e, targetGroupName) => {
    // Only clear if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragState(prev => ({
        ...prev,
        dropTarget: prev.dropTarget === targetGroupName ? null : prev.dropTarget
      }));
    }
  }, []);

  // 🎯 Handle successful drop
  const handleDrop = useCallback((e, targetGroupName) => {
    e.preventDefault();

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Validate drop
      if (!dragData || !targetGroupName || dragData.groupName === targetGroupName) {
  // ...existing code...
        return;
      }

      // Perform the drop action
      onDropAsset(dragData.groupName, targetGroupName, dragData.assetIndex);

      // Highlight the moved asset
      if (setLastAddedAssetId) {
        setLastAddedAssetId(dragData.asset.id);
      }

      // Success feedback (you could add a toast notification here)
  // ...existing code...

    } catch (error) {
  // ...existing code...
    } finally {
      // Clear drag state
      setDragState({
        isDragging: false,
        draggedAsset: null,
        dropTarget: null,
        isValidDrop: true,
        dragPosition: { x: 0, y: 0 }
      });
    }
  }, [onDropAsset, setLastAddedAssetId]);

  // 🎯 Handle drag end (cleanup)
  const handleDragEnd = useCallback(() => {
    // Reset document styles
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    // Clear drag state
    setDragState({
      isDragging: false,
      draggedAsset: null,
      dropTarget: null,
      isValidDrop: true,
      dragPosition: { x: 0, y: 0 }
    });
  }, []);

  // 🎯 Track mouse movement during drag
  const handleDragMove = useCallback((e) => {
    if (dragState.isDragging) {
      setDragState(prev => ({
        ...prev,
        dragPosition: { x: e.clientX, y: e.clientY }
      }));
    }
  }, [dragState.isDragging]);

  return {
    dragState,
    handlers: {
      handleDragStart,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
      handleDragEnd,
      handleDragMove
    }
  };
};
