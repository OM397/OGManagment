import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, UserCircle, ChevronDown, Menu, Mail, Key } from 'lucide-react';
import { API_BASE } from './config';
import apiClient from './services/apiService';
import ChangePasswordModal from './ChangePasswordModal';
import EmailPreferencesModal from './EmailPreferencesModal';

// Utilidad para enmascarar un email (ej: a***@dominio.com) para que si se exfiltra el DOM no se revele completo.
function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (!local) return email;
  const visible = local[0];
  return `${visible}${'*'.repeat(Math.max(1, Math.min(4, local.length - 1)))}` + '@' + domain;
}

export default function Topbar({ currency = 'EUR €', onReload = () => {}, user, onLogout, onToggleSidebar, menuButtonClassName = '' }) {
  // Bandera para ignorar el primer evento de cierre tras abrir el menú
  const justOpenedDropdown = useRef(false);
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [username, setUsername] = useState(user || '');
  const [emailPreference, setEmailPreference] = useState(null);

  useEffect(() => {
    if (!username) {
      // Use axios client with interceptors; don't force logout on first 401
      apiClient.get('/user')
        .then((res) => {
          const data = res?.data;
          if (data?.maskedEmail) setUsername(data.maskedEmail);
          else if (data?.uid) setUsername(data.uid);
        })
        .catch(() => { /* ignore: allow global auth flow to handle */ });
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
    if (!username) return;
    // Use axios client with interceptors; tolerate transient 401
    apiClient.get('/email-preference')
      .then((res) => {
        const data = res?.data;
        if (data && typeof data.receiveWeeklyEmail === 'boolean') {
          setEmailPreference(data.receiveWeeklyEmail);
        }
      })
      .catch(() => { /* ignore */ });
  };

  const handleDropdownOpen = () => {
    setOpen(!open);
    if (!open && username) {
      loadEmailPreference();
      // Ignorar el primer evento de cierre tras abrir el menú
      justOpenedDropdown.current = true;
      setTimeout(() => { justOpenedDropdown.current = false; }, 300);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!open) return;
      // Ignorar el primer evento tras abrir el menú
      if (justOpenedDropdown.current) return;
      if (dropdownRef.current && (dropdownRef.current === e.target || dropdownRef.current.contains(e.target))) {
        return;
      }
      setOpen(false);
    };
    // Use mousedown + click instead of touchstart to avoid consuming the first
    // touch on mobile (which can force double-tap). click fires after touchend
    // and is less likely to interfere with UI controls.
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [open]);

  return (
    <header className="z-40 flex flex-row items-center justify-between gap-1 py-2 px-2 sm:gap-2 sm:py-4 sm:px-4 lg:px-6 border-b border-gray-200 bg-white mb-6 w-full">
      {/* Left + Center + Right en una sola fila */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
        <button
          className={`md:hidden text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition-colors ${menuButtonClassName}`}
          onClick={e => {
            e.stopPropagation();
            onToggleSidebar(e);
          }}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="hidden sm:block text-sm text-gray-600 font-medium whitespace-nowrap">Portfolio</div>
        <button 
        //  onClick={e => { console.log('[Topbar] Reload button clicked'); onReload(e); }} 
          className="hidden sm:block text-gray-500 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors ml-2"
          aria-label="Reload data"
        >
          <RefreshCw size={18} />
        </button>
        <div className="text-xs sm:text-sm text-gray-700 font-medium bg-gray-50 px-2 sm:px-3 py-1 rounded-full ml-1 sm:ml-2 whitespace-nowrap">{currency}</div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleDropdownOpen}
            style={{ 
              cursor: 'pointer', 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 px-2 sm:px-3 py-1 sm:py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserCircle size={16} className="text-gray-500 sm:size-5" />
            <span className="max-w-[80px] sm:max-w-[120px] truncate font-medium">{maskEmail(username) || 'Cargando...'}</span>
            <ChevronDown size={12} className="text-gray-400 sm:size-4" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                onClick={e => { setShowModal(true); setOpen(false); }}
                style={{ 
                  cursor: 'pointer', 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors"
              >
                <Key size={16} className="text-gray-500" />
                Modificar contraseña
              </button>
              <button
                onClick={e => { console.log('[Topbar] Email preferences clicked'); setShowEmailModal(true); setOpen(false); }}
                style={{ 
                  cursor: 'pointer', 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
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
                onClick={e => { onLogout(e); }}
                style={{ 
                  cursor: 'pointer', 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
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
