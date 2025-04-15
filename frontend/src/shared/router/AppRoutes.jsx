// 📁 frontend/src/shared/router/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginWithRedirect from '../../features/auth/LoginWithRedirect';
import AdminPanel from '../../features/admin/AdminPanel';
import RequireAuth from '../auth/RequireAuth';
import { CategoryGroupsProvider } from '../context/CategoryGroupsContext';
import InnerApp from '../layout/InnerApp';

export default function AppRoutes({ user, role, initialData, onLogout, onLogin }) {
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
