// 📁 frontend/src/shared/ChangePasswordModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from './config';

export default function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/change-password`, {
        currentPassword,
        newPassword
      }, { withCredentials: true });

      if (res.data.success) {
        setMessage('✅ Contraseña actualizada correctamente. Cerrando sesión...');

        setTimeout(() => {
          sessionStorage.clear();
          window.location.href = '/login'; // Redirige al login
        }, 2000);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al cambiar la contraseña.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm relative">
        <h3 className="text-lg font-semibold mb-4">Modificar contraseña</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Contraseña actual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="text-gray-600 hover:underline">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
