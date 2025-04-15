import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import './shared/styles/index.css';
import AppRoutes from './shared/router/AppRoutes';
import { API_BASE } from './shared/config';

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
      setAuthChecked(true);
      return;
    }

    try {
      const resUser = await fetch(`${API_BASE}/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resUser.ok) throw new Error();

      const { username, role } = await resUser.json();
      setUser(username);
      setRole(role);
      sessionStorage.setItem('username', username);
      sessionStorage.setItem('role', role);

      const resData = await fetch(`${API_BASE}/user-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resData.ok) throw new Error();

      const result = await resData.json();
      setInitialData(result?.data || {});
    } catch {
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
