export default function ChartTabs({ selectedId, userAssets = [], groupNames = [], onSelect }) {
  const groupTabs = groupNames.map(g => ({ id: `GROUP:${g}`, label: g }));
  const assetTabs = userAssets.map(a => ({ id: a.id, label: a.nameShort || a.name.split(' ')[0] }));

  return (
    <div className="mb-5 w-full space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Grupos</h3>
        </div>
  <nav className="flex flex-wrap gap-2 pb-1" aria-label="Group filters">
          <FilterTab
            key="ALL"
            active={selectedId === 'ALL'}
            label="Total"
            onClick={() => onSelect('ALL')}
          />
          {groupTabs.map(tab => (
            <FilterTab
              key={tab.id}
              active={selectedId === tab.id}
              label={tab.label}
              onClick={() => onSelect(tab.id)}
            />
          ))}
        </nav>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assets</h3>
        </div>
    <nav className="flex flex-wrap gap-2 pb-1 w-full" aria-label="Asset filters" style={{ rowGap: '0.5rem', maxHeight: 'none', width: '100%' }}>
          {assetTabs.map(tab => (
            <FilterTab
              key={tab.id}
              active={selectedId === tab.id}
              label={tab.label}
              onClick={() => onSelect(tab.id)}
            />
          ))}
        </nav>

        
      </div>
    </div>
  );
}

function FilterTab({ active, label, onClick, title }) {
  return (
    <button
      type="button"
      title={title || label}
      onClick={onClick}
      style={{ touchAction: 'manipulation' }}
      className={`relative min-w-[90px] basis-[90px] max-w-[120px] px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500 shadow-sm border truncate ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {label}
      {active && (
        <span className="absolute inset-0 rounded-full ring-2 ring-gray-900/30 animate-pulse-slow pointer-events-none" aria-hidden="true" />
      )}
    </button>
  );
}