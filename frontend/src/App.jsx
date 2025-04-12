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
    navigate('/');
  };

  const fetchUserData = async () => {
    try {
      console.log('⏳ Verificando sesión...');

      const userInfo = await fetch(`${API_BASE}/user`, { credentials: 'include' });
      const rawCookie = document.cookie;
      console.log('🍪 Cookie actual:', rawCookie);

      if (!userInfo.ok) {
        console.log('❌ /user falló con status', userInfo.status);
        throw new Error('Fallo al obtener usuario');
      }

      const { username, role } = await userInfo.json();
      console.log('✅ Usuario autenticado:', { username, role });
      setUser(username);
      setRole(role);

      const userData = await fetch(`${API_BASE}/user-data`, { credentials: 'include' });
      if (!userData.ok) {
        console.log('❌ /user-data falló con status', userData.status);
        throw new Error('Fallo al obtener datos');
      }

      const result = await userData.json();
      const data = result?.data || {};
      console.log('📦 Datos del usuario:', data);
      setInitialData(data);
    } catch (err) {
      console.log('⚠️ Sesión inválida o error:', err);
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
            <LoginWithRedirect />
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
            <LoginWithRedirect />
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
