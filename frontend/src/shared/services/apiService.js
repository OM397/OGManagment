// 📁 frontend/src/shared/services/apiService.js
import axios from 'axios';
import { API_BASE } from '../config';

// Detect iOS devices (iPhone/iPad/iPod or iPadOS Safari identifying as Mac with touch)
const IS_IOS = (() => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const isIOSDevice = /iP(hone|od|ad)/.test(platform) || (/Mac/.test(platform) && 'ontouchend' in document);
  const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua);
  return isIOSDevice && isSafari;
})();

// 🔧 Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Importante para enviar cookies httpOnly
  timeout: 30000,
});

// Eliminado: iOS fallback con localStorage - ahora confiamos solo en cookies HttpOnly
// try {
//   const stored = localStorage.getItem('accessToken');
//   if (stored && IS_IOS) {
//     apiClient.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
//   }
// } catch (_) {}

// 🔄 Estado simplificado para renovación de tokens
let refreshPromise = null;
let isRefreshing = false;

// Función para limpiar el estado de refresh
const clearRefreshState = () => {
  refreshPromise = null;
  isRefreshing = false;
};

// Función para manejar errores de autenticación
const handleAuthError = (error) => {
  console.warn('[API] Error de autenticación:', error?.response?.data?.error || error.message);
  
  // Limpiar headers de autorización
  delete apiClient.defaults.headers.common['Authorization'];
  
  // En lugar de redirigir, dejar que React Router maneje el estado no autenticado
  // El AuthContext detectará la falta de token y redirigirá apropiadamente
};

// 📤 Interceptor de respuesta simplificado
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // No interceptar errores de endpoints de autenticación
    const url = (originalRequest?.url || '');
    const isAuthRequest = /\/login$|\/refresh$|\/logout$|\/register$|\/forgot-password$/.test(url);

    // Solo manejar errores 401 que no sean de auth y no hayan sido reintentados
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      const errorData = error.response.data || {};
      const code = errorData?.code;
      
      // Determinar si debemos intentar refresh
      const shouldRefresh = errorData?.requiresRefresh || 
                           ['TOKEN_EXPIRED', 'SESSION_NOT_FOUND'].includes(code) ||
                           (IS_IOS && code === 'MISSING_TOKEN');
      
      if (shouldRefresh) {
        // Marcar que ya intentamos este request
        originalRequest._retry = true;
        
        // Si ya estamos refrescando, esperar a que termine
        if (isRefreshing && refreshPromise) {
          try {
            await refreshPromise;
            // Reintentar el request original
          return apiClient(originalRequest);
        } catch (refreshError) {
            handleAuthError(refreshError);
            return Promise.reject(refreshError);
          }
        }
        
        // Iniciar proceso de refresh
        isRefreshing = true;
        refreshPromise = apiClient.post('/refresh')
          .then(() => {
            // Refresh exitoso, limpiar estado
            clearRefreshState();
            // Reintentar el request original
            return apiClient(originalRequest);
          })
          .catch((refreshError) => {
            // Refresh falló, limpiar estado y manejar error
            clearRefreshState();
            handleAuthError(refreshError);
              return Promise.reject(refreshError);
          });
        
        return refreshPromise;
      }
    }
    
    // Para otros errores, simplemente rechazar
    return Promise.reject(error);
  }
);

// 🔒 Funciones de autenticación
export const authAPI = {
  /**
   * Iniciar sesión
   */
  async login(username, password) {
    const response = await apiClient.post('/login', { username, password });
    const data = response.data;
    // En dev podrías opcionalmente inyectar Authorization header, pero NO lo guardamos en storage.
    if (data?.accessToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
  // iOS-only fallback persist across reloads (no refresh token stored)
  try { if (IS_IOS) sessionStorage.setItem('accessToken', data.accessToken); } catch (_) {}
    }
  // Eliminado: Marcar bootstrap de autenticación para tolerar fallos transitorios de refresh
  // try { lastAuthBootstrapAt = Date.now(); } catch(_) {}
    return data;
  },

  /**
   * Login con Google (credential = ID token)
   */
  async googleLogin(credential) {
    const response = await apiClient.post('/google-login', { credential });
    const data = response.data;
    if (data?.accessToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
      try { if (IS_IOS) sessionStorage.setItem('accessToken', data.accessToken); } catch (_) {}
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  // Eliminado: Marcar bootstrap de autenticación para tolerar fallos transitorios de refresh
  // try { lastAuthBootstrapAt = Date.now(); } catch(_) {}
    return data;
  },

  /**
   * Registrar usuario
   */
  async register(email) {
  const response = await apiClient.post('/register', { email });
  // Tras registrar NO hay sesión por defecto (a menos que el backend haga auto-login).
  // Limpiamos cualquier rastro de Authorization previo para evitar 403 con cuentas nuevas.
  try { sessionStorage.clear(); localStorage.clear(); } catch (_) {}
  delete apiClient.defaults.headers.common['Authorization'];
  return response.data;
  },

  /**
   * Solicitar regeneración de contraseña (flujo olvidé mi contraseña)
   */
  async forgotPassword(email) {
    const response = await apiClient.post('/forgot-password', { email });
    return response.data;
  },

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      await apiClient.post('/logout');
    } catch (error) {
  // ...existing code...
    }
    
    // Limpiar storage independientemente del resultado
  // Limpieza agresiva de cualquier rastro previo (aunque ya no guardamos tokens/username)
  try { sessionStorage.clear(); } catch (_) {}
  // Eliminado: localStorage.clear();
  delete apiClient.defaults.headers.common['Authorization'];
  },

  /**
   * Cerrar todas las sesiones
   */
  async logoutAll() {
    try {
      await apiClient.post('/logout-all');
    } catch (error) {
  // ...existing code...
    }
    
  try { sessionStorage.clear(); } catch (_) {}
  // Eliminado: localStorage.clear();
  delete apiClient.defaults.headers.common['Authorization'];
  },

  /**
   * Obtener sesiones activas
   */
  async getSessions() {
    const response = await apiClient.get('/sessions');
    return response.data.sessions;
  },

  /**
   * Cerrar sesión específica
   */
  async logoutSession(sessionId) {
    const response = await apiClient.delete(`/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Verificar estado de autenticación
   */
  async checkAuth() {
    try {
      const response = await apiClient.get('/user');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// 📊 Funciones de API general
export const dataAPI = {
  /**
   * Obtener datos del usuario
   */
  async getUserData() {
    const response = await apiClient.get('/user-data');
    return response.data;
  },

  /**
   * Obtener tickers
   */
  async getTickers() {
    const response = await apiClient.get('/tickers');
    return response.data;
  },

  /**
   * Análisis de inversión
   */
  async analyzeInvestment(data) {
    const response = await apiClient.post('/investments/analyze', data);
    return response.data;
  }
};


// Exportar cliente por defecto
export default apiClient;
