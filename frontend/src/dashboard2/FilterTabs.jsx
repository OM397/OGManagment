// FilterTabs.jsx - Filtro visual para grupos y assets en Dashboard2
import React from 'react';

// Generic FilterTabs for Dashboard2: receives tabs [{id, label}], selectedId, onSelect
export default function FilterTabs({ tabs = [], selectedId, onSelect }) {
  return (
    <div className="mb-4">
  <div className="flex gap-2 flex-wrap w-full" style={{ rowGap: '0.5rem', width: '100%' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            style={{ 
              cursor: 'pointer', 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
            className={`min-w-[90px] basis-[90px] max-w-[120px] px-3 py-1 rounded text-sm font-medium transition-colors ${selectedId === tab.id ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'}`}
            onClick={() => onSelect(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
