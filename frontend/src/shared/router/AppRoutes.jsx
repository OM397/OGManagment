// 📁 frontend/src/shared/router/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginWithRedirect from '../../features/auth/LoginWithRedirect';
import AdminPanel from '../../features/admin/AdminPanel';
import RequireAuth from '../auth/RequireAuth';
import { CategoryGroupsProvider } from '../context/CategoryGroupsContext';
import InnerApp from '../layout/InnerApp';
import PrivacyPolicy from '../../pages/PrivacyPolicy';
import TermsOfService from '../../pages/TermsOfService';
import CookiePolicy from '../../pages/CookiePolicy';

export default function AppRoutes({ user, role, initialData, onLogout }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          !user ? (
            <LoginWithRedirect />
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
            <LoginWithRedirect />
          ) : role === 'admin' ? (
            <AdminPanel onLogout={onLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      {/* Rutas legales - accesibles sin autenticación */}
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
