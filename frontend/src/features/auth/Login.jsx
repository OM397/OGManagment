// 📁 frontend/src/features/auth/Login.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../../shared/services/apiService';
import { useAuth } from '../../shared/context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleButtonVisible, setGoogleButtonVisible] = useState(false);
  const googleBtnRef = useRef(null);
  const googleRenderedRef = useRef(false);

  // Detectar si estamos en Safari móvil
  const isSafariMobile = () => {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua);
  };

  // Carga dinámica del script de Google Identity (no requiere CSP inline)
  useEffect(() => {
    if (window.google?.accounts?.id) { setGoogleReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = () => setGoogleReady(true);
    s.onerror = () => setGoogleReady(false);
    document.head.appendChild(s);
  }, []);

  // Verificar si el botón de Google se renderizó correctamente
  useEffect(() => {
    if (!googleReady || !googleBtnRef.current) return;
    
    // En Safari móvil, verificar si el botón se renderizó después de un delay
    const checkButtonVisibility = () => {
      const buttonElement = googleBtnRef.current?.querySelector('div[role="button"]');
      if (buttonElement) {
        setGoogleButtonVisible(true);
      } else if (isSafariMobile()) {
        // En Safari móvil, si no se renderizó después de 3 segundos, mostrar botón alternativo
        setTimeout(() => {
          const buttonElement = googleBtnRef.current?.querySelector('div[role="button"]');
          if (!buttonElement) {
            setGoogleButtonVisible(false);
          }
        }, 3000);
      }
    };

    const timer = setTimeout(checkButtonVisibility, 1000);
    return () => clearTimeout(timer);
  }, [googleReady]);

  // Initialize GIS and render the official button once when ready
  useEffect(() => {
    const init = async () => {
      let client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!client_id) {
        try {
          const res = await fetch('/api/public-config', { credentials: 'include' });
          const json = await res.json();
          client_id = json?.googleClientId || '';
        } catch (_) { /* ignore */ }
      }
      if (!googleReady || !window.google?.accounts?.id || googleRenderedRef.current) return;
      if (!client_id) return;
    try {
      window.google.accounts.id.initialize({
        client_id,
        callback: async ({ credential }) => {
          try {
            const data = await authAPI.googleLogin(credential);
            if (!data?.success) throw new Error('Operación fallida.');
            // Usar el contexto de autenticación con mejor manejo
            await login({ uid: data.uid, role: data.role, maskedEmail: data.maskedEmail });
            // Pequeño delay para asegurar que el estado se actualice antes de navegar
            setTimeout(() => {
              if (data.role === 'admin' && location.pathname.startsWith('/admin')) {
                navigate('/admin', { replace: true });
              } else {
                navigate('/', { replace: true });
              }
            }, 50);
          } catch (e) {
            const msg = e.response?.data?.error || e.message || 'Error con Google';
            setError(msg);
          }
        },
        ux_mode: 'popup',
        auto_select: false,
        use_fedcm_for_pr: false
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          size: 'large',
          theme: 'outline',
          text: 'continue_with',
          shape: 'pill'
        });
      }
      googleRenderedRef.current = true;
    } catch {
      // ignore init errors; user can retry by reloading
      }
    };
    init();
  }, [googleReady, location.pathname, navigate, login]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

  if (!trimmedUsername || (!isRegistering && !forgotMode && !trimmedPassword)) {
      setError('Por favor, completa los campos requeridos.');
      setLoading(false);
      return;
    }

    if (isRegistering && !isValidEmail(trimmedUsername)) {
      setError('Introduce un correo electrónico válido.');
      setLoading(false);
      return;
    }

    try {
      if (forgotMode) {
        const res = await authAPI.forgotPassword(trimmedUsername);
        setInfo(res?.message || 'Si existe la cuenta, se enviará un correo.');
      } else if (isRegistering) {
        const res = await authAPI.register(trimmedUsername);
        if (!res?.success) throw new Error('Operación fallida.');
        if (res.alreadyExists) {
          setInfo('ℹ️ Ese correo ya existe. Inicia sesión con tu contraseña.');
        } else {
          setInfo('✅ Revisa tu correo para la contraseña temporal.');
        }
      } else {
  console.log('[Login] Enviando credenciales...');
  const data = await authAPI.login(trimmedUsername, trimmedPassword);
        if (!data?.success) throw new Error('Operación fallida.');
  // Usar el contexto de autenticación
        await login({ uid: data.uid, role: data.role, maskedEmail: data.maskedEmail });
  console.log('[Login] Éxito. uid=', data.uid, 'role=', data.role, 'tokenId=', data.tokenId);
        // Redirección: solo ir a /admin si el usuario estaba en /admin
        setTimeout(() => {
          if (data.role === 'admin' && location.pathname.startsWith('/admin')) {
            navigate('/admin', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 50);
      }

    } catch (err) {
  const msg = err.response?.data?.error || err.message || 'Error en la autenticación';
  console.warn('[Login] Error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-xl space-y-6 p-6 bg-white rounded-2xl shadow-xl">
        <div className="flex justify-center mb-2">
          <img src="/logo.png" alt="OG Managements" className="h-[300px] w-auto object-contain" />
        </div>

        <h2 className="text-center text-lg font-semibold text-gray-800 mt-0">
          {isRegistering ? 'Registro' : 'Iniciar sesión'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Correo electrónico"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-700"
          />

          {!isRegistering && !forgotMode && (
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-700"
            />
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {info && <p className="text-green-600 text-sm text-center">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 text-white text-sm font-semibold rounded transition-all duration-150 ${
              loading ? 'bg-gray-400' : 'bg-[#1f1f1f] hover:bg-black'
            }`}
          >
            {loading ? 'Procesando...' : forgotMode ? 'Enviar nueva contraseña' : isRegistering ? 'Registrarme' : 'Entrar'}
          </button>

          {!isRegistering && !forgotMode && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">o</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              {/* Official Google button mount point */}
              <div ref={googleBtnRef} className="justify-center" />
              {!googleReady && (
                <button
                  type="button"
                  disabled
                  className="w-full items-center justify-center gap-2 border border-gray-300 rounded py-2 text-sm font-medium bg-gray-100 text-gray-400"
                >
                  Cargando Google...
                </button>
              )}
              {/* Botón alternativo para Safari móvil */}
              {googleReady && isSafariMobile() && !googleButtonVisible && (
                <button
                  type="button"
                  onClick={() => {
                    // Intentar abrir el popup de Google manualmente
                    if (window.google?.accounts?.id) {
                      window.google.accounts.id.prompt();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded py-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </button>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => {
                  if (forgotMode) {
                    setForgotMode(false);
                  } else {
                    setIsRegistering(!isRegistering);
                  }
                  setError('');
                  setInfo('');
                }}
                className="px-2 py-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 transition-colors"
              >
                {forgotMode ? 'Volver a iniciar sesión' : isRegistering ? 'Ya tengo cuenta' : 'Quiero registrarme'}
              </button>
              {!isRegistering && !forgotMode && (
                <>
                  <span className="hidden sm:inline text-gray-300 select-none">|</span>
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setError(''); setInfo(''); }}
                    className="px-2 py-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 transition-colors"
                  >
                    Olvidé mi contraseña
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
