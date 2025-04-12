// 📁 frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './shared/styles/index.css';
import Sidebar from './shared/Sidebar';
import Topbar from './shared/Topbar';
import Portfolio from './features/portfolio/Portfolio';
import useMarketData from './features/assets/useMarketData';
import { CategoryGroupsProvider, useCategoryGroups } from './shared/context/CategoryGroupsContext';
import Login from './features/auth/Login';
import AdminPanel from './features/admin/AdminPanel';
import { API_BASE } from './shared/config';
import { jwtDecode } from 'jwt-decode';

function InnerApp({ user }) {
  const { categoryGroups } = useCategoryGroups();
  const [exchangeRates] = useState({ EUR: 1, USD: 1.1, GBP: 0.85 });
  const [selected, setSelected] = useState('Assets');
  const { marketData } = useMarketData(categoryGroups || {}, 0);

  let totalValue = 0;
  Object.values(categoryGroups || {}).forEach(category => {
    if (typeof category === 'object' && category !== null) {
      Object.values(category).forEach(group => {
        if (Array.isArray(group)) {
          group.forEach(asset => {
            const price =
              marketData?.cryptos?.[asset.id]?.eur ||
              marketData?.stocks?.[asset.id]?.eur || 0;
            totalValue += (asset.initialQty || 0) * price;
          });
        }
      });
    }
  });

  if (!categoryGroups) return <div className="p-6 text-center">Cargando datos del usuario...</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar selected={selected} setSelected={setSelected} totalValue={totalValue} />
      <main className="flex-1 p-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <Topbar user={user} />
          {selected === 'Assets' && (
            <Portfolio initialData={categoryGroups} exchangeRates={exchangeRates} />
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  const pathname = window.location.pathname;
  const isAdminPath = pathname.startsWith('/admin');

  const [user, setUser] = useState(localStorage.getItem(isAdminPath ? 'admin_username' : 'username') || '');
  const [token, setToken] = useState(localStorage.getItem(isAdminPath ? 'admin_token' : 'token') || '');
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (!user || !token) return;

    if (!isAdminPath) {
      fetch(`${API_BASE}/user-data`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setInitialData(data);
        })
        .catch(() => {
          setInitialData({ Investments: {}, 'Real Estate': {}, Others: {} });
        });
    }
  }, [user, token, isAdminPath]);

  const handleLogin = (username, token) => {
    const decoded = jwtDecode(token);

    if (decoded.role === 'admin') {
      localStorage.setItem('admin_username', username);
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.setItem('username', username);
      localStorage.setItem('token', token);
    }

    setUser(username);
    setToken(token);
  };

  if (!user || !token) return <Login onLogin={handleLogin} />;
  if (!initialData && !isAdminPath) return <div className="p-6 text-center">Cargando datos del usuario...</div>;

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <CategoryGroupsProvider initialData={initialData}>
              <InnerApp user={user} />
            </CategoryGroupsProvider>
          }
        />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to={isAdminPath ? "/admin" : "/"} />} />
      </Routes>
    </Router>
  );
}

export default App;
