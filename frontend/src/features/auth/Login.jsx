// 📁 frontend/src/features/auth/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../shared/config';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError('Por favor, complete ambos campos.');
      return;
    }

    const endpoint = isRegistering ? '/register' : '/login';

    try {
      const response = await axios.post(
        `${API_BASE}${endpoint}`,
        {
          username: trimmedUsername,
          password: trimmedPassword
        },
        {
          withCredentials: true
        }
      );

      if (!response?.data?.success || !response.data.role) {
        throw new Error('Login fallido.');
      }

      localStorage.clear();
      onLogin(trimmedUsername, response.data.role);
      window.location.href = response.data.role === 'admin' ? '/admin' : '/';
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error en la autenticación';
      setError(msg);
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
          placeholder="Usuario"
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
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {isRegistering ? 'Crear cuenta' : 'Entrar'}
        </button>
        <button
          type="button"
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-sm underline mt-2"
        >
          {isRegistering ? 'Ya tengo cuenta' : 'Quiero registrarme'}
        </button>
      </form>
    </div>
  );
}
