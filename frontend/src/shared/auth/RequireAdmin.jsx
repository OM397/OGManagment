// 📁 frontend/src/shared/auth/RequireAdmin.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function RequireAdmin({ user, role, children }) {
  if (!user || role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}
