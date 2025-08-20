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

// Nota: ya no persistimos accessToken en sessionStorage para reducir superficie de ataque.
// Si necesitas pruebas locales con Authorization, ajusta manualmente aquí de forma temporal.

// iOS fallback: si los cookies se bloquean en iOS Safari tras un reload, usa Authorization
// con un accessToken efímero guardado en sessionStorage. Esto NO almacena refresh token.
try {
  const stored = localStorage.getItem('accessToken');
  if (stored && IS_IOS) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
  }
} catch (_) {}

// 🔄 Estado de renovación para evitar múltiples intentos simultáneos
let isRefreshing = false;
let failedQueue = [];
let iosMissingTried = false; // evita bucles por MISSING_TOKEN en iOS
// Gracia post-login: evitar redirect duro por fallos de refresh inmediatamente después de iniciar sesión
let lastAuthBootstrapAt = 0;

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// 📤 Interceptor de respuesta para manejo automático de tokens
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // No interceptar errores de endpoints de autenticación
    const url = (originalRequest && (originalRequest.url || '')) || '';
    const isAuthRequest = /\/login$|\/refresh$|\/logout$/.test(url);

    // Si es error 401 y el request no es de auth, intentar renovar token
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      const errorData = error.response.data || {};
      const code = errorData?.code;
      const allowIOSMissing = IS_IOS && code === 'MISSING_TOKEN' && !iosMissingTried;
      const shouldRefresh = !!(errorData?.requiresRefresh || ['TOKEN_EXPIRED','SESSION_NOT_FOUND'].includes(code) || allowIOSMissing);
      
      if (shouldRefresh) {
        // Marcar que ya intentamos una vez el caso iOS MISSING_TOKEN
        if (allowIOSMissing) iosMissingTried = true;
        
        if (isRefreshing) {
          // Si ya estamos renovando, agregar a la cola
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            return apiClient(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Intentar renovar el token
          await apiClient.post('/refresh');
          
          // Si la renovación fue exitosa, procesar la cola
          processQueue(null);
          isRefreshing = false;
          
          // Reintentar la petición original
          return apiClient(originalRequest);
          
        } catch (refreshError) {
          // Si la renovación falla, limpiar sesión
          processQueue(refreshError);
          isRefreshing = false;

          // Caso iOS/MISSING_TOKEN: evitar recargar en bucle. Limpiar y salir sin redirect duro.
          if (allowIOSMissing) {
            try { localStorage.removeItem('accessToken'); } catch(_) {}
            delete apiClient.defaults.headers.common['Authorization'];
            return Promise.reject(refreshError);
          }

          // Gracia post-login: si acaba de iniciar sesión (últimos 5s), no forzar redirect duro.
          try {
            const withinGrace = Date.now() - lastAuthBootstrapAt < 5000;
            if (withinGrace) {
              return Promise.reject(refreshError);
            }
          } catch (_) {}

          // Otros casos: redirigir a login de forma controlada
          try { localStorage.clear(); } catch(_) {}
          delete apiClient.defaults.headers.common['Authorization'];
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
  }
    }

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
  // Marcar bootstrap de autenticación para tolerar fallos transitorios de refresh
  try { lastAuthBootstrapAt = Date.now(); } catch(_) {}
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
  // Marcar bootstrap de autenticación para tolerar fallos transitorios de refresh
  try { lastAuthBootstrapAt = Date.now(); } catch(_) {}
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
  try { sessionStorage.clear(); localStorage.clear(); } catch (_) {}
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
    
  try { sessionStorage.clear(); localStorage.clear(); } catch (_) {}
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
   * Obtener historial
   */
  async getHistory(params = {}) {
    const response = await apiClient.get('/history', { params });
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
