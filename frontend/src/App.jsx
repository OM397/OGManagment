// 📁 frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './shared/styles/index.css';
import Sidebar from './shared/Sidebar';
import Topbar from './shared/Topbar';
import Portfolio from './features/portfolio/Portfolio';
import useMarketData from './features/assets/useMarketData';
import { CategoryGroupsProvider, useCategoryGroups } from './shared/context/CategoryGroupsContext';
import Login from './features/auth/Login';
import AdminPanel from './features/admin/AdminPanel';
import { API_BASE } from './shared/config';

function InnerApp({ user, onLogout }) {
  const { categoryGroups } = useCategoryGroups();
  const [exchangeRates] = useState({ EUR: 1, USD: 1.1, GBP: 0.85 });
  const [selected, setSelected] = useState('Assets');
  const { marketData } = useMarketData(categoryGroups || {}, 0);

  let totalValue = 0;
  Object.values(categoryGroups || {}).forEach(category => {
    if (typeof category === 'object') {
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
          <Topbar user={user} onLogout={onLogout} />
          {selected === 'Assets' && (
            <Portfolio initialData={categoryGroups} exchangeRates={exchangeRates} />
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState('');
  const [initialData, setInitialData] = useState(null);
  const [role, setRole] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
    setUser('');
    setRole('');
    setInitialData(null);
    localStorage.clear();
    window.location.href = '/';
  };

  const fetchUserData = async () => {
    try {
      const adminRes = await fetch(`${API_BASE}/admin-only`, { credentials: 'include' });
      if (adminRes.ok) {
        const data = await adminRes.json();
        setUser(data.username);
        setRole('admin');
      } else {
        const userRes = await fetch(`${API_BASE}/user-data`, { credentials: 'include' });
        if (!userRes.ok) throw new Error();
        const data = await userRes.json();
        setUser(data.username);
        setRole('user');
        setInitialData(data.data);
      }
    } catch (_) {
      setUser('');
      setRole('');
      setInitialData(null);
    } finally {
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleLogin = (username, role) => {
    setUser(username);
    setRole(role);
    fetchUserData();
  };

  if (!authChecked) return <div className="p-6 text-center">Verificando sesión...</div>;

  return (
    <Routes>
      <Route
        path="/"
        element={
          !user ? (
            <Login onLogin={handleLogin} />
          ) : initialData ? (
            <CategoryGroupsProvider initialData={initialData}>
              <InnerApp user={user} onLogout={logout} />
            </CategoryGroupsProvider>
          ) : (
            <div className="p-6 text-center">Cargando datos del usuario...</div>
          )
        }
      />
      <Route
        path="/admin"
        element={
          user && role === 'admin' ? (
            <AdminPanel onLogout={logout} />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
