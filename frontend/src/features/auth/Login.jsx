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

    if (!trimmedUsername || !trimmedPassword) {
      setError('Por favor, complete ambos campos.');
      setLoading(false);
      return;
    }

    if (isRegistering && !isValidEmail(trimmedUsername)) {
      setError('Por favor, introduce un correo electrónico válido.');
      setLoading(false);
      return;
    }

    const endpoint = isRegistering ? '/register' : '/login';
    const payload = isRegistering
      ? { email: trimmedUsername, password: trimmedPassword }
      : { username: trimmedUsername, password: trimmedPassword };

    try {
      const response = await axios.post(`${API_BASE}${endpoint}`, payload, {
        withCredentials: true,
      });

      if (!response?.data?.success) {
        throw new Error('Operación fallida.');
      }

      if (isRegistering) {
        setInfo('✅ Solicitud enviada. Tu cuenta está pendiente de aprobación.');
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
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl font-semibold mb-4">
        {isRegistering ? 'Registro' : 'Iniciar sesión'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Correo electrónico"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {info && <p className="text-green-600 text-sm">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className={`w-full p-2 rounded text-white ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Procesando...' : isRegistering ? 'Crear cuenta' : 'Entrar'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
            setInfo('');
          }}
          className="text-sm underline mt-2"
        >
          {isRegistering ? 'Ya tengo cuenta' : 'Quiero registrarme'}
        </button>
      </form>
    </div>
  );
}
