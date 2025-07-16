import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, UserCircle, ChevronDown, Menu, Mail, Key } from 'lucide-react';
import { API_BASE } from './config';
import ChangePasswordModal from './ChangePasswordModal';
import EmailPreferencesModal from './EmailPreferencesModal';

export default function Topbar({ currency = 'EUR €', onReload = () => {}, user, onLogout, onToggleSidebar }) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [username, setUsername] = useState(user || sessionStorage.getItem('username') || '');
  const [emailPreference, setEmailPreference] = useState(null);

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

    // Cargar preferencia de email
    if (username) {
      loadEmailPreference();
    }
  }, [username]);

  const handleEmailModalClose = () => {
    setShowEmailModal(false);
    // Recargar preferencia después de cerrar el modal
    loadEmailPreference();
  };

  const loadEmailPreference = () => {
    if (username) {
      fetch(`${API_BASE}/email-preference`, { credentials: 'include' })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data && typeof data.receiveWeeklyEmail === 'boolean') {
            setEmailPreference(data.receiveWeeklyEmail);
          }
        })
        .catch(() => {});
    }
  };

  const handleDropdownOpen = () => {
    setOpen(!open);
    // Cuando se abre el dropdown, recargar la preferencia por si cambió en el admin
    if (!open && username) {
      loadEmailPreference();
    }
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
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4 px-4 sm:px-6 border-b border-gray-200 bg-white mb-6">
      {/* Left */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          className="md:hidden text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition-colors"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="text-sm text-gray-600 font-medium">Portfolio</div>
      </div>

      {/* Right */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 text-sm w-full sm:w-auto justify-between sm:justify-end">
        <button 
          onClick={onReload} 
          className="text-gray-500 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Reload data"
        >
          <RefreshCw size={18} />
        </button>

        <div className="text-sm text-gray-700 font-medium bg-gray-50 px-3 py-1 rounded-full">{currency}</div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleDropdownOpen}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserCircle size={20} className="text-gray-500" />
            <span className="max-w-[120px] truncate font-medium">{username || 'Cargando...'}</span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => { setShowModal(true); setOpen(false); }}
                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors"
              >
                <Key size={16} className="text-gray-500" />
                Modificar contraseña
              </button>
              <button
                onClick={() => { setShowEmailModal(true); setOpen(false); }}
                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Mail size={16} className="text-gray-500" />
                <div className="flex-1">Preferencias de email</div>
                {emailPreference !== null && (
                  <div className={`w-2 h-2 rounded-full ${emailPreference ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                )}
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={onLogout}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-b-lg transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && <ChangePasswordModal onClose={() => setShowModal(false)} />}
      {showEmailModal && <EmailPreferencesModal onClose={handleEmailModalClose} />}
    </header>
  );
}
