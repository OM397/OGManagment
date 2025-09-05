import React, { Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './shared/styles/index.css';
import AppRoutes from './shared/router/AppRoutes';
import { LoadingSpinner } from './shared/design/components';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import EnhancedCookieBanner from './components/EnhancedCookieBanner';
import Footer from './components/Footer';

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
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={
        <div className="p-6 text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p>Cargando aplicación...</p>
        </div>
      }>
        <div className="flex-1">
          <AppRoutes
            user={user}
            role={role}
            initialData={initialData}
            onLogout={logout}
          />
        </div>
        <Footer />
      </Suspense>
      <EnhancedCookieBanner />
    </div>
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
