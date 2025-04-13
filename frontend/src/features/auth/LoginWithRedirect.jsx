// 📁 frontend/src/features/auth/LoginWithRedirect.jsx
import React from 'react';
import Login from './Login';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../shared/config';

export default function LoginWithRedirect() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE}/user`, { credentials: 'include' });
      if (!res.ok) throw new Error('Usuario no autenticado');
      const { role } = await res.json();
      navigate(role === 'admin' ? '/admin' : '/');
    } catch (err) {
      console.error('❌ Error confirmando sesión después del login', err);
    }
  };

  return <Login onLogin={handleLogin} />;
}
