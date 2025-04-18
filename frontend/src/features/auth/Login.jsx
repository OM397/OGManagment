// 📁 frontend/src/features/auth/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../shared/config';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || (!isRegistering && !trimmedPassword)) {
      setError('Por favor, completa los campos requeridos.');
      setLoading(false);
      return;
    }

    if (isRegistering && !isValidEmail(trimmedUsername)) {
      setError('Introduce un correo electrónico válido.');
      setLoading(false);
      return;
    }

    const endpoint = isRegistering ? '/register' : '/login';
    const payload = isRegistering
      ? { email: trimmedUsername }
      : { username: trimmedUsername, password: trimmedPassword };

    try {
      const response = await axios.post(`${API_BASE}${endpoint}`, payload, {
        withCredentials: true,
      });

      if (!response?.data?.success) throw new Error('Operación fallida.');

      if (isRegistering) {
        setInfo('✅ Revisa tu correo para la contraseña generada.');
      } else {
        localStorage.clear();
        sessionStorage.setItem('username', trimmedUsername);
        sessionStorage.setItem('role', response.data.role || '');
        sessionStorage.setItem('token', response.data.token);
        onLogin?.();
      }

    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error en la autenticación';
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

          {!isRegistering && (
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
            {loading ? 'Procesando...' : isRegistering ? 'Registrarme' : 'Entrar'}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setInfo('');
            }}
            className="text-xs text-[#555] hover:text-black block text-center"
          >
            {isRegistering ? 'Ya tengo cuenta' : 'Quiero registrarme'}
          </button>
        </form>
      </div>
    </div>
  );
}
