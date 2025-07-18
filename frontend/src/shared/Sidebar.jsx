// 📁 frontend/src/shared/Sidebar.jsx
import React from 'react';
import { BarChart2, Gem } from 'lucide-react';
import { calculateTotals } from './calculateAssetTotals';
import AnimatedNumber from './AnimatedNumber'; // ✅ import animation
import { formatter } from './utils';

export default function Sidebar({ selected, setSelected, categoryGroups = {}, marketData = {} }) {
  const navItems = [
    { name: 'Net Worth', label: 'Investments', icon: <BarChart2 size={18} /> },
    { name: 'Assets', label: 'Assets', icon: <Gem size={18} /> }
  ];

  const { totalActual: investmentsValue } = calculateTotals(categoryGroups, marketData, true);
  const { totalActual: allAssetsValue } = calculateTotals(categoryGroups, marketData, false);

  return (
    <aside className="w-64 min-w-[16rem] max-w-[16rem] shrink-0 bg-white border-r border-gray-200 min-h-screen flex flex-col justify-between shadow-sm">
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
            const animatedValue = name === 'Net Worth' ? investmentsValue : allAssetsValue;

            return (
              <button
                key={name}
                className={`flex items-center justify-between w-full text-left px-3 py-3 text-sm rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                }`}
                onClick={() => setSelected(name)}
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
                  </div>
                </div>

                <span className={`text-sm font-medium tabular-nums ${isActive ? 'text-gray-200' : 'text-gray-600'}`}>
                  <AnimatedNumber value={animatedValue} /> {/* ✅ animate here */}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="text-xs text-gray-400 p-4 border-t border-gray-100">
        <p>Made by El Gato ✨</p>
      </div>
    </aside>
  );
}
