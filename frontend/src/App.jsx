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
import RequireAdmin from './shared/auth/RequireAdmin';
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

function MainApp() {
  const [user, setUser] = useState(() => sessionStorage.getItem('username') || '');
  const [role, setRole] = useState(() => sessionStorage.getItem('role') || '');
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
    if (!token) return setAuthChecked(true);

    try {
      const userInfo = await fetch(`${API_BASE}/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!userInfo.ok) throw new Error('Fallo al obtener usuario');
      const { username, role } = await userInfo.json();
      setUser(username);
      setRole(role);
      sessionStorage.setItem('username', username);
      sessionStorage.setItem('role', role);

      const userData = await fetch(`${API_BASE}/user-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!userData.ok) throw new Error('Fallo al obtener datos');
      const result = await userData.json();
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

  const handleLogin = () => {
    fetchUserData(); // login exitoso → rehidrata usuario y data
  };

  if (!authChecked) return <div className="p-6 text-center">Verificando sesión...</div>;

  return (
    <Routes>
      <Route
        path="/"
        element={
          !user ? (
            <LoginWithRedirect onLogin={handleLogin} />
          ) : (
            <RequireAuth user={user}>
              <CategoryGroupsProvider key={user} initialData={initialData}>
                <InnerApp user={user} onLogout={logout} />
              </CategoryGroupsProvider>
            </RequireAuth>
          )
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin user={user} role={role}>
            <AdminPanel onLogout={logout} />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}
