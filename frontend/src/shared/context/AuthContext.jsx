// 📁 frontend/src/shared/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, dataAPI } from '../services/apiService';

// Estado inicial del contexto
const initialState = {
  user: '',
  role: '',
  initialData: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

  // Función para actualizar el estado
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Función para limpiar el estado de autenticación
  const clearAuth = useCallback(() => {
    setState({
      user: '',
      role: '',
      initialData: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  }, []);

  // Función para establecer el estado de autenticación
  const setAuth = useCallback((user, role, initialData = null) => {
    setState({
      user,
      role,
      initialData,
      isAuthenticated: !!user,
      isLoading: false,
      error: null
    });
  }, []);

  // Función para manejar errores de autenticación
  const setAuthError = useCallback((error) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false
    }));
  }, []);

  // Función para establecer estado de carga
  const setLoading = useCallback((isLoading) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  // Función para obtener datos del usuario (simplificada)
  const fetchUserData = useCallback(async (bootstrap = null) => {
    try {
      setLoading(true);
      setAuthError(null);

      // Si tenemos datos de bootstrap (login reciente), usarlos
      if (bootstrap && bootstrap.uid && bootstrap.role) {
        console.log('[AuthContext] Login optimista. uid=', bootstrap.uid, 'role=', bootstrap.role);
        // Usar maskedEmail si está disponible, sino uid como fallback
        const displayName = bootstrap.maskedEmail || bootstrap.uid;
        setAuth(displayName, bootstrap.role);
        
        // Enriquecer datos en background (no crítico) - con mejor manejo de errores
        setTimeout(async () => {
          try {
            const userData = await authAPI.checkAuth();
            const { maskedEmail, uid, role } = userData;
            const userDataResponse = await dataAPI.getUserData();
            // Usar maskedEmail para la UI, mantener consistencia
            setAuth(maskedEmail || uid, role, userDataResponse?.data || {});
          } catch (e) {
            console.warn('[AuthContext] checkAuth falló en background (ignorado):', e?.message);
            // No hacer nada - mantener el estado actual
          }
        }, 100); // Pequeño delay para evitar race conditions
        return;
      }

      // Verificación inicial de autenticación
      const userData = await authAPI.checkAuth();
      const { maskedEmail, uid, role } = userData;
      
      // Obtener datos del usuario (con manejo de errores mejorado)
      try {
        const userDataResponse = await dataAPI.getUserData();
        setAuth(maskedEmail || uid, role, userDataResponse?.data || {});
      } catch (dataError) {
        console.warn('Error obteniendo datos del usuario:', dataError);
        // No romper la sesión si falla obtener datos adicionales
        setAuth(maskedEmail || uid, role, {});
      }
    } catch (error) {
      console.warn('Error verificando autenticación:', error);
      clearAuth();
    }
  }, [setAuth, setAuthError, setLoading, clearAuth]);

  // Función para logout (simplificada)
  const logout = useCallback(async () => {
    console.log('🚨 LOGOUT INICIADO');
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('Error en logout:', error);
    } finally {
      clearAuth();
      // No redirigir aquí - dejar que el router maneje la redirección
      // El router detectará que no hay autenticación y redirigirá automáticamente
    }
  }, [clearAuth]);

  // Función para login (simplificada)
  const login = useCallback(async (bootstrap) => {
    await fetchUserData(bootstrap);
  }, [fetchUserData]);

  // Efecto para verificación inicial (simplificado)
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        await fetchUserData();
      } catch (error) {
        if (mounted) {
          console.warn('Error en inicialización de autenticación:', error);
          clearAuth();
        }
      }
    };

    // Timeout para evitar spinner infinito
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 5000);

    initAuth();

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [fetchUserData, setLoading, clearAuth]);

  // Valor del contexto
  const contextValue = {
    ...state,
    login,
    logout,
    fetchUserData,
    setAuth,
    setAuthError,
    setLoading,
    clearAuth,
    updateState
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
