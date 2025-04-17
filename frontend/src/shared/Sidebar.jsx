// 📁 frontend/src/shared/Sidebar.jsx
import React from 'react';
import { formatter } from './utils';
import { BarChart2, Gem } from 'lucide-react';
import { calculateTotals } from './calculateAssetTotals';

export default function Sidebar({ selected, setSelected, categoryGroups = {}, marketData = {} }) {
  const navItems = [
    { name: 'Net Worth', label: 'Investments', icon: <BarChart2 size={18} /> },
    { name: 'Assets', label: 'Assets', icon: <Gem size={18} /> }
  ];

  const { totalActual: investmentsValue } = calculateTotals(categoryGroups, marketData, true);
  const { totalActual: allAssetsValue } = calculateTotals(categoryGroups, marketData, false);

  return (
    <aside className="w-64 min-w-[16rem] max-w-[16rem] shrink-0 bg-[#f5f5f5] border-r min-h-screen flex flex-col justify-between">
      <div>
        <div className="p-6 flex justify-center">
          <img
            src="/logo-text.png"
            alt="OG Managements"
            className="h-10 w-auto object-contain"
          />
        </div>

        <nav className="px-3 space-y-1">
          {navItems.map(({ name, label, icon }) => {
            const isActive = selected === name;

            return (
              <button
                key={name}
                className={`flex items-center justify-between w-full text-left px-3 py-2 text-sm rounded transition ${
                  isActive
                    ? 'bg-gray-200 font-medium text-gray-900'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => setSelected(name)}
              >
                <div className="flex items-center gap-2">
                  {icon}
                  <div className="flex flex-col items-start">
                    <span>{label}</span>
                    {name === 'Net Worth' && (
                      <span className="text-[11px] text-gray-500">Dashboard</span>
                    )}
                  </div>
                </div>

                <span className="text-sm text-gray-500 font-normal">
                  {formatter.format(name === 'Net Worth' ? investmentsValue : allAssetsValue)}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="text-[11px] text-gray-400 p-4">
        <p>Made by El Gato ✨</p>
      </div>
    </aside>
  );
}
