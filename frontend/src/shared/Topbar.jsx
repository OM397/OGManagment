// 📁 frontend/src/shared/Topbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, UserCircle, ChevronDown } from 'lucide-react';

export default function Topbar({ currency = 'EUR €', onReload = () => {}, user }) {
  const username = user || sessionStorage.getItem('username');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('token');
    window.location.reload();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex justify-between items-center py-3 px-6 border-b bg-white mb-6">
      <div className="text-xs text-gray-500">Portfolio</div>

      <div className="flex items-center gap-6">
        <button onClick={onReload} className="text-gray-500 hover:text-black transition">
          <RefreshCw size={18} />
        </button>

        <div className="text-sm text-gray-700">{currency}</div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-black transition"
          >
            <UserCircle size={20} className="text-gray-400" />
            <span>{username}</span>
            <ChevronDown size={16} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-36 bg-white border rounded shadow-md z-10">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
