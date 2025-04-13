// 📁 frontend/src/features/auth/LoginWithRedirect.jsx
import React from 'react';
import Login from './Login';
import { useNavigate } from 'react-router-dom';

export default function LoginWithRedirect() {
  const navigate = useNavigate();

  const handleLogin = () => {
    const role = sessionStorage.getItem('role');
    navigate(role === 'admin' ? '/admin' : '/');
  };

  return <Login onLogin={handleLogin} />;
}
