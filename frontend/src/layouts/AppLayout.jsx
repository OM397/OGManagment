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
  <div className="bg-gray-50 min-h-screen">
    <div className="flex min-h-screen">
      <Sidebar 
        selected={selectedView}
        setSelected={setSelectedView}
        categoryGroups={categoryGroups}
        marketData={marketData}
        isOpen={sidebarOpen}
        onClose={() => {
      //    console.log('Sidebar onClose called. sidebarOpen antes:', sidebarOpen);
          setSidebarOpen(false);
        }}
        className="border-4 border-green-500"
      />
      
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20 lg:hidden"
          style={{ pointerEvents: 'auto' }}
          onTouchEnd={e => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[AppLayout] Overlay touched. sidebarOpen antes:', sidebarOpen);
            setSidebarOpen(false);
          }}
          onClick={e => {
            // Only handle click if not from touch
            if (e.detail === 0) return; // Skip programmatic clicks
            e.stopPropagation();
            console.log('[AppLayout] Overlay clicked. Event:', e.type, 'sidebarOpen antes:', sidebarOpen);
            setSidebarOpen(false);
          }}
        />
      )}
      
  {/* Main content area */}
  <div className="flex-1 flex flex-col min-w-0 pb-6">
        <Topbar 
          user={user}
          onLogout={onLogout}
          onReload={onReload}
          onToggleSidebar={handleToggleSidebar}
          menuButtonClassName="z-50"
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
