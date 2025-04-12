// 📁 frontend/src/features/auth/LoginWithRedirect.jsx
import React from 'react';
import Login from './Login';
import { useNavigate } from 'react-router-dom';

export default function LoginWithRedirect() {
  const navigate = useNavigate();

  const handleLogin = (username, role) => {
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  return <Login onLogin={handleLogin} />;
}

