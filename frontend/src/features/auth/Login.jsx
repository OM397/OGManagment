import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../shared/config';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

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
      const response = await axios.post(`${API_BASE}${endpoint}`, {
        username: trimmedUsername,
        password: trimmedPassword
      });

      if (response.data.success) {
        localStorage.setItem('username', trimmedUsername);
        localStorage.setItem('token', response.data.token);
        if (response.data.role) {
          localStorage.setItem('role', response.data.role); // ✅ guardar role si está presente
        }
        onLogin(trimmedUsername, response.data.token);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error en la autenticación';
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
