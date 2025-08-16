import Sidebar from '../shared/Sidebar';

// 🏗️ Main Application Layout
import React, { useEffect, useState } from 'react';
import Topbar from '../shared/Topbar';

export default function AppLayout({ 
  children, 
  selectedView, 
  setSelectedView, 
  user, 
  onLogout, 
  onReload,
  onChangePassword,
  onMailingSettings,
  categoryGroups,
  marketData 
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Handler con logs para depuración
  const handleToggleSidebar = (e) => {
  //  console.log('[AppLayout] handleToggleSidebar called. Event:', e.type, 'sidebarOpen antes:', sidebarOpen);
    setSidebarOpen((prev) => {
   //   console.log('[AppLayout] sidebarOpen después:', !prev, 'Event:', e?.type);
      return !prev;
    });
  };

  // Simple event bridge to allow deep children to request view changes
  useEffect(() => {
    const handler = (e) => {
      const view = e?.detail?.view;
      if (view && typeof setSelectedView === 'function') {
        setSelectedView(view);
        setSidebarOpen(false);
      }
    };
    window.addEventListener('app:navigate', handler);

    // Handler para cerrar sidebar desde evento global
    const closeSidebarHandler = () => setSidebarOpen(false);
    window.addEventListener('app:closeSidebar', closeSidebarHandler);

    return () => {
      window.removeEventListener('app:navigate', handler);
      window.removeEventListener('app:closeSidebar', closeSidebarHandler);
    };
  }, [setSelectedView]);

  return (
  <div className={`bg-gray-50 min-h-screen ${sidebarOpen ? 'sidebar-open' : ''}`}>
    <div className="flex min-h-screen">
      <Sidebar 
        selected={selectedView}
        setSelected={setSelectedView}
        categoryGroups={categoryGroups}
        marketData={marketData}
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
        }}
      />
      
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden"
          onTouchEnd={e => {
            e.preventDefault();
            e.stopPropagation();
            setSidebarOpen(false);
          }}
          onClick={e => {
            if (e.detail === 0) return;
            e.stopPropagation();
            setSidebarOpen(false);
          }}
        />
      )}
      
  {/* Main content area */}
  <div className="flex-1 flex flex-col min-w-0 pb-6 relative z-10">
        <Topbar 
          user={user}
          onLogout={onLogout}
          onReload={onReload}
          onToggleSidebar={handleToggleSidebar}
        />
        {/* Centered, responsive wrapper: base constrained, wider on xl, full on ultra-wide */}
        <div className="flex-1 w-full">
          <main className="mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 max-w-7xl xl:max-w-[1500px]">
            {children}
          </main>
        </div>
      </div>
    </div>
  </div>
  );
}
