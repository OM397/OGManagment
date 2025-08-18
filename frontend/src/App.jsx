import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import './shared/styles/index.css';
import AppRoutes from './shared/router/AppRoutes';
import { LoadingSpinner } from './shared/design/components';
import { authAPI, dataAPI } from './shared/services/apiService';

function App() {
  const [user, setUser] = useState('');
  const [role, setRole] = useState('');
  const [initialData, setInitialData] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    console.log('🚨 LOGOUT INICIADO');
    try {
      await authAPI.logout();
    } catch (_) {}
    setUser('');
    setRole('');
    setInitialData(null);
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/';
  };

  const fetchUserData = async (bootstrap) => {
    // Bootstrap path: called right after login with raw token response
    if (bootstrap && bootstrap.uid && bootstrap.role) {
      const hadUser = !!user;
      if (!hadUser) {
        console.log('[App] Login optimista. uid=', bootstrap.uid, 'role=', bootstrap.role);
        setUser(bootstrap.uid);
        setRole(bootstrap.role);
      }
      // Marcamos autenticación verificada para que el router cambie inmediatamente
      setAuthChecked(true);
      // Navegación forzada si es admin o estabas apuntando a /admin
      try {
        const currentPath = window.location.pathname;
        if (bootstrap.role === 'admin') {
          // Solo forzar /admin si el usuario ya intentaba acceder a /admin
          if (currentPath.startsWith('/admin')) {
            console.log('[App] Manteniendo /admin para admin.');
          }
        } else if (!bootstrap.role || bootstrap.role !== 'admin') {
          // Si no es admin y estaba en /admin, llevarlo a /
          if (currentPath.startsWith('/admin')) {
            window.history.replaceState({}, '', '/');
          }
        }
      } catch (_) {}
      // Intento en background para enriquecer datos (no limpiar estado si falla)
      (async () => {
        try {
          const userData = await authAPI.checkAuth();
          const { maskedEmail, uid, role } = userData;
          setUser(maskedEmail || uid);
          setRole(role);
          try { sessionStorage.setItem('role', role); } catch (_) {}
          try {
            const userDataResponse = await dataAPI.getUserData();
            setInitialData(userDataResponse?.data || {});
          } catch (dataError) {
            console.warn('Error obteniendo datos del usuario (bg):', dataError);
            if (initialData == null) setInitialData({});
          }
        } catch (e) {
          console.warn('[App] checkAuth falló en background tras login (ignorado):', e?.message);
        }
      })();
      return;
    }

    // Ruta inicial (sin bootstrap): comportamiento original
    try {
      const userData = await authAPI.checkAuth();
      const { maskedEmail, uid, role } = userData;
      setUser(maskedEmail || uid);
      setRole(role);
      try { sessionStorage.setItem('role', role); } catch (_) {}
      try {
        const userDataResponse = await dataAPI.getUserData();
        setInitialData(userDataResponse?.data || {});
      } catch (dataError) {
        console.warn('Error obteniendo datos del usuario:', dataError);
        // No romper sesión en móvil si /user-data falla puntualmente
        setInitialData(prev => prev || {});
        // iOS-only: un reintento rápido por si las cookies llegaron tarde tras el reload
        const ua = navigator.userAgent || '';
        const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
        if (isIOS) {
          try {
            await new Promise(r => setTimeout(r, 350));
            const userDataResponse = await dataAPI.getUserData();
            setInitialData(userDataResponse?.data || {});
          } catch (_) {}
        }
      }
    } catch (error) {
      console.warn('Error verificando autenticación:', error);
      // Fallback: si hay datos en sessionStorage, considerarlos válidos temporalmente
      try {
        const fallbackUser = sessionStorage.getItem('username');
        const fallbackRole = sessionStorage.getItem('role');
        if (fallbackUser && fallbackRole) {
          console.log('[App] Usando fallback de sessionStorage');
          setUser(fallbackUser);
          setRole(fallbackRole);
        } else {
          setUser('');
          setRole('');
          setInitialData(null);
          try { sessionStorage.clear(); localStorage.clear(); } catch (_) {}
        }
      } catch (_) {
        setUser('');
        setRole('');
        setInitialData(null);
        try { sessionStorage.clear(); localStorage.clear(); } catch (_) {}
      }
    } finally {
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    let mounted = true;
    const withTimeout = Promise.race([
      fetchUserData(),
      new Promise(resolve => setTimeout(resolve, 5000)) // evita spinner infinito
    ]).finally(() => {
      if (mounted) setAuthChecked(prev => prev || true);
    });
    return () => { mounted = false; };
  }, []);

  if (!authChecked) return (
    <div className="p-6 text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />
      <p>Verificando sesión...</p>
    </div>
  );

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
        onLogin={fetchUserData}
      />
    </Suspense>
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
