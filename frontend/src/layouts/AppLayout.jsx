// 🏗️ Main Application Layout
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        selected={selectedView}
        setSelected={setSelectedView}
        categoryGroups={categoryGroups}
        marketData={marketData}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar 
          user={user}
          onLogout={onLogout}
          onReload={onReload}
          onChangePassword={onChangePassword}
          onMailingSettings={onMailingSettings}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
