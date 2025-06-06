import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, UserCircle, ChevronDown, Menu } from 'lucide-react';
import { API_BASE } from './config';
import ChangePasswordModal from './ChangePasswordModal';

export default function Topbar({ currency = 'EUR €', onReload = () => {}, user, onLogout, onToggleSidebar }) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState(user || sessionStorage.getItem('username') || '');

  useEffect(() => {
    if (!username) {
      fetch(`${API_BASE}/user`, { credentials: 'include' })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.username) {
            setUsername(data.username);
            sessionStorage.setItem('username', data.username);
          }
        })
        .catch(() => {});
    }
  }, [username]);

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
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-3 px-4 sm:px-6 border-b bg-white mb-6">
      {/* Left */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          className="md:hidden text-gray-600 hover:text-black"
          onClick={onToggleSidebar}
        >
          <Menu size={20} />
        </button>
        <div className="text-xs text-gray-500 font-medium">Portfolio</div>
      </div>

      {/* Right */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-6 text-sm w-full sm:w-auto justify-between sm:justify-end">
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
            <span className="max-w-[100px] truncate">{username || 'Cargando...'}</span>
            <ChevronDown size={16} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-md z-10">
              <button
                onClick={() => { setShowModal(true); setOpen(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Modificar contraseña
              </button>
              <button
                onClick={onLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && <ChangePasswordModal onClose={() => setShowModal(false)} />}
    </header>
  );
}
