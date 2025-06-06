// 📁 frontend/src/features/auth/LoginWithRedirect.jsx
import React from 'react';
import Login from './Login';

export default function LoginWithRedirect({ onLogin }) {
  return <Login onLogin={onLogin} />;
}
