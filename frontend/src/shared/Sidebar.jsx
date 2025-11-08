// 📁 frontend/src/shared/Sidebar.jsx
import React from 'react';
import { BarChart2, Gem, Home } from 'lucide-react';
import { calculateTotals } from './calculateAssetTotals';
import { formatter } from './utils';
import usePortfolioOverview from '../dashboard2/usePortfolioOverview';

export default function Sidebar({ selected, setSelected, categoryGroups = {}, marketData = {}, isOpen = true, onClose }) {
  const navItems = [
    { name: 'Assets', label: 'Assets', icon: <Gem size={18} /> },
    { name: 'Net Worth', label: 'Investments', icon: <BarChart2 size={18} /> },
    { name: 'RealEstateDashboard', label: 'Real Estate', icon: <Home size={18} /> },
  ];

  // Usar el mismo hook que Dashboard2 para el total actual de inversiones
  const { totalCurrent } = usePortfolioOverview(categoryGroups, marketData);
  
  // Calcular el total de Assets (Investments + Real Estate + Others)
  const assetGroups = ['Investments', 'Real Estate', 'Others'];
  const filteredGroups = Object.fromEntries(
    Object.entries(categoryGroups).filter(([key]) => assetGroups.includes(key))
  );
  const { totalActual: totalAssets } = calculateTotals(filteredGroups, marketData);
  
  // ✅ Calcular Real Estate usando la misma lógica que los otros
  const realEstateGroups = Object.fromEntries(
    Object.entries(categoryGroups).filter(([key]) => key === 'Real Estate')
  );
  const { totalActual: realEstateTotal = 0 } = calculateTotals(realEstateGroups, marketData);

  // Permitir cierre del sidebar en móvil si se pasa la prop onClose
  const handleSelect = (name) => {
   // console.log('[Sidebar] Menu item clicked:', name);
    setSelected(name);
    if (onClose) onClose();
  };

  return (
    <>
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-full sm:w-72 sm:min-w-[18rem] sm:max-w-[18rem] shrink-0 bg-white border-r border-gray-200 min-h-screen flex flex-col justify-between shadow-sm transform transition-transform duration-300 ease-out lg:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ touchAction: 'manipulation' }}
      >
        <div>
          <div className="p-4 md:p-6 flex justify-center border-b border-gray-100">
            <img
              src="/logo-text.png"
              alt="OG Managements"
              className="h-8 md:h-10 w-auto object-contain"
            />
          </div>

          <nav className="px-2 md:px-3 py-4 space-y-1">
            {navItems.map(({ name, label, icon }) => {
              const isActive = selected === name;
              let animatedValue = null;
              if (name === 'Net Worth') animatedValue = totalCurrent;
              if (name === 'Assets') animatedValue = totalAssets;
              if (name === 'RealEstateDashboard') animatedValue = realEstateTotal;

              return (
                <button
                  key={name}
                  className={`flex items-center justify-between w-full text-left px-3 py-3 text-sm rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                  }`}
                  onClick={() => handleSelect(name)}
                  style={{ touchAction: 'manipulation' }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${isActive ? 'text-white' : 'text-gray-500'}`}> 
                      {icon}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{label}</span>
                      {name === 'Net Worth' && (
                        <span className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>Dashboard</span>
                      )}
                      {name === 'RealEstateDashboard' && (
                        <span className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>Dashboard</span>
                      )}
                    </div>
                  </div>

                  {animatedValue !== null ? (
                    <span className={`text-sm font-medium tabular-nums ${isActive ? 'text-gray-200' : 'text-gray-600'}`}>
                      {formatter.format(animatedValue)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="text-xs text-gray-400 p-4 border-t border-gray-100">
          <p>Made by El Gato ✨</p>
        </div>
      </aside>
    </>
  );
}