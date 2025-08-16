// 📁 frontend/src/shared/MailingSettingsModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from './config';

export default function MailingSettingsModal({ onClose }) {
  const [receiveWeeklyEmail, setReceiveWeeklyEmail] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch current user mailing preferences
  useEffect(() => {
    const fetchMailingSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/email-preference`, {
          withCredentials: true
        });
        
        if (res.data?.receiveWeeklyEmail !== undefined) {
          setReceiveWeeklyEmail(res.data.receiveWeeklyEmail);
        }
      } catch (err) {
        console.error('Error fetching mailing settings:', err);
        let msg = 'Error al cargar la configuración de mailing';
        
        if (err.response?.status === 401) {
          msg = 'Sesión expirada. Redirigiendo al login...';
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else if (err.response?.data?.error) {
          msg = err.response.data.error;
        }
        
        setError(msg);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchMailingSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/email-preference`, {
        receiveWeeklyEmail
      }, {
        withCredentials: true
      });

      if (res.data.success) {
        setMessage('✅ Configuración de mailing actualizada correctamente');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Error updating mailing settings:', err);
      let msg = 'Error al actualizar la configuración';
      
      if (err.response?.status === 401) {
        msg = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        // Redirect to login after showing message
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else if (err.response?.data?.error) {
        msg = err.response.data.error;
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
        <div className="bg-white rounded shadow-lg p-6">
          <p>Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded shadow-lg flex w-full max-w-3xl relative">
        {/* Logo izquierdo */}
        <div className="flex items-center justify-center px-6 bg-white w-1/3">
          <img
            src="/logo.png"
            alt="Logo"
            className="max-h-[260px] object-contain"
          />
        </div>

        {/* Formulario derecho */}
        <div className="flex-1 p-6 relative">
          <button
            className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-xl"
            onClick={onClose}
          >
            ✕
          </button>

          <h3 className="text-lg font-semibold mb-6">Configuración de Mailing</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={receiveWeeklyEmail}
                  onChange={(e) => setReceiveWeeklyEmail(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  Recibir resumen semanal por email
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-7">
                Recibirás un resumen semanal de tu portfolio todos los domingos por la mañana
              </p>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {message && <p className="text-green-600 text-sm">{message}</p>}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="text-gray-600 hover:underline">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-black hover:bg-gray-900'}`}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
