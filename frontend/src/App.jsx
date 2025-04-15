// 📁 frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './shared/styles/index.css';
import Sidebar from './shared/Sidebar';
import Topbar from './shared/Topbar';
import Portfolio from './features/portfolio/Portfolio';
import useMarketData from './features/assets/useMarketData';
import { CategoryGroupsProvider, useCategoryGroups } from './shared/context/CategoryGroupsContext';
import LoginWithRedirect from './features/auth/LoginWithRedirect';
import AdminPanel from './features/admin/AdminPanel';
import RequireAuth from './shared/auth/RequireAuth';
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

function AppRoutes({ user, role, initialData, onLogout, onLogin }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          !user ? (
            <LoginWithRedirect onLogin={onLogin} />
          ) : (
            <RequireAuth user={user}>
              <CategoryGroupsProvider key={user} initialData={initialData}>
                <InnerApp user={user} onLogout={onLogout} />
              </CategoryGroupsProvider>
            </RequireAuth>
          )
        }
      />
      <Route
        path="/admin"
        element={
          !user ? (
            <LoginWithRedirect onLogin={onLogin} />
          ) : role === 'admin' ? (
            <AdminPanel onLogout={onLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  const [user, setUser] = useState('');
  const [role, setRole] = useState('');
  const [initialData, setInitialData] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
    setUser('');
    setRole('');
    setInitialData(null);
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  const fetchUserData = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No token en sessionStorage');
      setAuthChecked(true);
      return;
    }

    try {
      const resUser = await fetch(`${API_BASE}/user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!resUser.ok) throw new Error('❌ Error user');
      const { username, role } = await resUser.json();
      setUser(username);
      setRole(role);
      sessionStorage.setItem('username', username);
      sessionStorage.setItem('role', role);

      const resData = await fetch(`${API_BASE}/user-data`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!resData.ok) throw new Error('❌ Error data');
      const result = await resData.json();
      setInitialData(result?.data || {});
    } catch (err) {
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

  if (!authChecked) return <div className="p-6 text-center">Verificando sesión...</div>;

  return (
    <AppRoutes
      user={user}
      role={role}
      initialData={initialData}
      onLogout={logout}
      onLogin={fetchUserData}
    />
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
