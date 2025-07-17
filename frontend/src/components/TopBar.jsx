// 📱 Application Top Bar Component
import React, { useState, useRef, useEffect } from 'react';
import { User, RefreshCw, LogOut, Settings, Mail, Menu } from 'lucide-react';

export default function TopBar({ user, onReload, onChangePassword, onMailingSettings, onMenuClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('username');
    window.location.reload();
  };

  const handleChangePassword = () => {
    setDropdownOpen(false);
    if (onChangePassword) {
      onChangePassword();
    }
  };

  const handleMailingSettings = () => {
    setDropdownOpen(false);
    if (onMailingSettings) {
      onMailingSettings();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            title="Open menu"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex-1">
            {/* Space for future search or breadcrumbs */}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Reload Button */}
          <button
            onClick={onReload}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Reload market data"
          >
            <RefreshCw size={18} />
          </button>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <User size={18} />
              <span className="text-sm font-medium hidden sm:block">{user || 'User'}</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm text-gray-600">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{user || 'User'}</p>
                </div>
                
                <div className="py-1">
                  <button
                    onClick={handleChangePassword}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={16} />
                    Change Password
                  </button>
                  
                  <button
                    onClick={handleMailingSettings}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Mail size={16} />
                    Mailing Settings
                  </button>
                </div>
                
                <div className="border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
