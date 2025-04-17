export default function ChartTabs({ selectedId, userAssets, onSelect }) {
    return (
      <div className="mb-4 border-b border-gray-200 w-full">
        <nav className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 text-sm">
          <button
            className={`mr-4 pb-2 border-b-2 font-medium transition-all duration-300 ${
              selectedId === 'ALL' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'
            }`}
            onClick={() => onSelect('ALL')}
          >
            Total
          </button>
          {userAssets.map(asset => (
            <button
              key={asset.id}
              title={asset.name}
              className={`mr-4 pb-2 border-b-2 font-medium transition-all duration-300 ${
                selectedId === asset.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-400 hover:text-black'
              }`}
              onClick={() => onSelect(asset.id)}
            >
              {asset.nameShort}
            </button>
          ))}
        </nav>
      </div>
    );
  }
  