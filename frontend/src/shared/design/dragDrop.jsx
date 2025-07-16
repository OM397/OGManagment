// 🎯 Enhanced Drag & Drop Visual Feedback Components
import React from 'react';
import { Badge } from '../design/components';
import { CurrencyDisplay } from '../design/financial';

// 🌟 Drop Zone Indicator
export const DropZoneIndicator = ({ 
  isActive, 
  isValidDrop = true, 
  groupName,
  className = '' 
}) => {
  if (!isActive) return null;

  return (
    <div className={`
      absolute inset-0 rounded-lg border-2 border-dashed transition-all duration-200 z-10
      ${isValidDrop 
        ? 'border-green-400 bg-green-50/80 backdrop-blur-sm' 
        : 'border-red-400 bg-red-50/80 backdrop-blur-sm'
      } ${className}
    `}>
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <div className={`
            w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center
            ${isValidDrop ? 'bg-green-100' : 'bg-red-100'}
          `}>
            {isValidDrop ? (
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <p className={`
            text-sm font-medium
            ${isValidDrop ? 'text-green-800' : 'text-red-800'}
          `}>
            {isValidDrop 
              ? `Mover a "${groupName}"` 
              : 'Movimiento no permitido'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

// 🎨 Drag Ghost/Preview
export const DragPreview = ({ asset, isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="
      fixed top-0 left-0 pointer-events-none z-50 
      transform -translate-x-2 -translate-y-2
      opacity-90 scale-95
    ">
      <div className="
        bg-white border-2 border-gray-300 rounded-lg shadow-xl
        p-3 min-w-[200px] max-w-[300px]
      ">
        <div className="flex items-center gap-3">
          <div className="
            w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center
            text-gray-600 text-sm font-semibold
          ">
            {asset.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {asset.name}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="gray" size="sm">
                {asset.type === 'manual' ? 'Manual' : asset.type === 'crypto' ? 'Crypto' : 'Stock'}
              </Badge>
              <CurrencyDisplay 
                value={asset.actualValue || 0} 
                size="sm" 
                className="text-gray-600" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🎯 Drag Handle
export const DragHandle = ({ className = '' }) => {
  return (
    <div className={`
      opacity-0 group-hover:opacity-100 transition-opacity duration-200
      cursor-grab active:cursor-grabbing
      p-1 rounded hover:bg-gray-100
      ${className}
    `}>
      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M7 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H7zM6 6h8v2H6V6zm0 4h8v2H6v-2z"/>
      </svg>
    </div>
  );
};

// 🌊 Drop Zone Ripple Effect
export const DropRipple = ({ x, y, isActive }) => {
  if (!isActive) return null;

  return (
    <div 
      className="absolute pointer-events-none z-20"
      style={{ left: x - 50, top: y - 50 }}
    >
      <div className="
        w-24 h-24 border-2 border-green-400 rounded-full
        animate-ping opacity-75
      " />
    </div>
  );
};
