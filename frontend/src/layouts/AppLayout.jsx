// 🏗️ Main Application Layout
import React from 'react';
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
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        selected={selectedView}
        setSelected={setSelectedView}
        categoryGroups={categoryGroups}
        marketData={marketData}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar 
          user={user}
          onLogout={onLogout}
          onReload={onReload}
          onChangePassword={onChangePassword}
          onMailingSettings={onMailingSettings}
        />
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
