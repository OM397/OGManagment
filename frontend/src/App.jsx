import React, { Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './shared/styles/index.css';
import AppRoutes from './shared/router/AppRoutes';
import { LoadingSpinner } from './shared/design/components';
import { AuthProvider, useAuth } from './shared/context/AuthContext';

// Componente interno que usa el contexto
function AppContent() {
  const { user, role, initialData, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
    <div className="p-6 text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p>Verificando sesión...</p>
    </div>
  );
  }

  return (
    <Suspense fallback={
      <div className="p-6 text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p>Cargando aplicación...</p>
      </div>
    }>
      <AppRoutes
        user={user}
        role={role}
        initialData={initialData}
        onLogout={logout}
      />
    </Suspense>
  );
}

// Componente principal envuelto en el AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
