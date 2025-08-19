// 📁 frontend/src/features/auth/Login.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../../shared/services/apiService';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleInitRef = useRef(false);

  // Cargar Google Identity Services script de forma dinámica
  useEffect(() => {
    const ensureInit = () => {
      const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!window.google?.accounts?.id || !client_id) {
        setGoogleReady(false);
        return;
      }
      if (googleInitRef.current) {
        setGoogleReady(true);
        return;
      }
      try {
        window.google.accounts.id.initialize({
          client_id,
          callback: async (response) => {
            try {
              const data = await authAPI.googleLogin(response.credential);
              if (!data?.success) throw new Error('Operación fallida.');
              localStorage.clear();
              localStorage.setItem('username', data.email || '');
              localStorage.setItem('role', data.role || '');
              onLogin?.({ uid: data.uid, role: data.role });
              if (data.role === 'admin' && location.pathname.startsWith('/admin')) {
                navigate('/admin', { replace: true });
              } else {
                navigate('/', { replace: true });
              }
            } catch (err) {
              const msg = err.response?.data?.error || err.message || 'Error con Google Sign-In';
              setError(msg);
            }
          },
          auto_select: false,
          ux_mode: 'popup',
          // Preferir FedCM cuando esté disponible (evita deprecaciones futuras)
          use_fedcm_for_pr: true
        });
        googleInitRef.current = true;
        setGoogleReady(true);
      } catch (e) {
        setGoogleReady(false);
      }
    };

    if (window.google?.accounts?.id) {
      ensureInit();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = ensureInit;
    script.onerror = () => setGoogleReady(false);
    document.head.appendChild(script);
  }, [location.pathname, navigate, onLogin]);

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
  localStorage.clear();
  localStorage.setItem('username', trimmedUsername);
  localStorage.setItem('role', data.role || '');
  // Actualización optimista inmediata para re-render sin esperar /user
        onLogin?.({ uid: data.uid, role: data.role });
  console.log('[Login] Éxito. uid=', data.uid, 'role=', data.role, 'tokenId=', data.tokenId);
        // Redirección: solo ir a /admin si el usuario estaba en /admin
        if (data.role === 'admin' && location.pathname.startsWith('/admin')) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }

    } catch (err) {
  const msg = err.response?.data?.error || err.message || 'Error en la autenticación';
  console.warn('[Login] Error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setInfo('');
    if (!googleReady || !window.google?.accounts?.id) {
      setError('Google Sign-In no está disponible en este momento.');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => {
        window.google.accounts.id.prompt((notification) => {
          // Si no se muestra, informamos un hint para orígenes
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setInfo('No se pudo mostrar Google Sign-In. Verifica origen autorizado en Google Cloud y prueba en incógnito.');
          }
          resolve();
        });
      });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error con Google Sign-In';
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
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || !googleReady}
                className={`w-full flex items-center justify-center gap-2 border border-gray-300 rounded py-2 text-sm font-medium ${
                  loading || !googleReady ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-4 w-4" />
                {googleReady ? 'Continuar con Google' : 'Cargando Google...'}
              </button>
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
