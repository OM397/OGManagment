// 📁 frontend/src/shared/Sidebar.jsx
import React from 'react';
import { formatter } from './utils';
import { BarChart2, Gem } from 'lucide-react';

export default function Sidebar({ selected, setSelected, totalValue = 0 }) {
  const navItems = [
    { name: 'Net Worth', icon: <BarChart2 size={18} /> },
    { name: 'Assets', icon: <Gem size={18} /> }
  ];

  return (
    <aside className="w-64 min-w-[16rem] max-w-[16rem] shrink-0 bg-[#f5f5f5] border-r min-h-screen flex flex-col justify-between">
      <div>
        {/* Branding - Bigger logo text image */}
        <div className="p-6 flex justify-center">
          <img
            src="/logo-text.png"
            alt="OG Managements"
            className="h-10 w-auto object-contain" // ← altura aumentada
          />
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-1">
          {navItems.map(({ name, icon }) => {
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
                    <span>{name}</span>
                    {name === 'Net Worth' && (
                      <span className="text-[11px] text-gray-500">Dashboard</span>
                    )}
                  </div>
                </div>

                {name === 'Assets' && (
                  <span className="text-sm text-gray-500 font-normal">
                    {formatter.format(totalValue)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="text-[11px] text-gray-400 p-4">
        <p>Made by El Gato ✨</p>
      </div>
    </aside>
  );
}
