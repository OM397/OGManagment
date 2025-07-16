import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from './config';
import { Button, Card, Badge, LoadingSpinner } from './design/components';
import tokens from './design/tokens';

export default function EmailPreferencesModal({ onClose }) {
  const [receiveWeeklyEmail, setReceiveWeeklyEmail] = useState(false);
  const [initialValue, setInitialValue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Cargar preferencia actual
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const response = await axios.get(`${API_BASE}/email-preference`, { withCredentials: true });
        const value = response.data.receiveWeeklyEmail;
        setReceiveWeeklyEmail(value);
        setInitialValue(value); // Guardar valor inicial
      } catch (err) {
        setError('Error al cargar preferencias');
        console.error('Error loading email preference:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreference();
  }, []);

  // Función para recargar preferencias
  const reloadPreference = async () => {
    try {
      const response = await axios.get(`${API_BASE}/email-preference`, { withCredentials: true });
      const newValue = response.data.receiveWeeklyEmail;
      
      // Si el valor cambió desde que se abrió el modal, notificar
      if (initialValue !== newValue && !loading) {
        setMessage(`⚠️ La preferencia fue modificada desde el panel de administrador`);
      }
      
      setReceiveWeeklyEmail(newValue);
      return newValue;
    } catch (err) {
      console.error('Error reloading preference:', err);
      return null;
    }
  };

  // Detectar cuando el modal se vuelve visible para recargar datos
  useEffect(() => {
    // Recargar preferencia cada vez que se abre el modal
    reloadPreference();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      // Primero obtenemos el estado actual por si cambió mientras teníamos el modal abierto
      await reloadPreference();
      
      const response = await axios.post(`${API_BASE}/email-preference`, 
        { receiveWeeklyEmail }, 
        { withCredentials: true }
      );

      if (response.data.success) {
        setMessage(response.data.message || 'Preferencia actualizada correctamente');
        // Confirmar que el cambio se guardó correctamente
        await reloadPreference();
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error al actualizar preferencia';
      setError(errorMsg);
      // En caso de error, recargar el estado actual
      await reloadPreference();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
        <Card padding="lg" className="max-w-sm w-full">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">Cargando preferencias...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg flex flex-col lg:flex-row w-full max-w-4xl max-h-[90vh] relative overflow-hidden">
        {/* Logo - oculto en móvil, visible en desktop */}
        <div className="hidden lg:flex items-center justify-center px-8 bg-gray-50 lg:w-1/3">
          <img
            src="/logo.png"
            alt="Logo"
            className="max-h-[240px] w-auto object-contain"
          />
        </div>

        {/* Formulario - responsive */}
        <div className="flex-1 p-6 lg:p-8 relative overflow-y-auto">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>

          {/* Logo pequeño en móvil */}
          <div className="lg:hidden flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-16 w-auto object-contain"
            />
          </div>

          <h3 className="text-xl lg:text-2xl font-semibold mb-6 text-gray-900">Preferencias de Email</h3>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                id="receiveWeeklyEmail"
                checked={receiveWeeklyEmail}
                onChange={(e) => setReceiveWeeklyEmail(e.target.checked)}
                className="mt-1.5 h-5 w-5 text-gray-900 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                disabled={saving}
              />
              <div className="flex-1 min-w-0">
                <label htmlFor="receiveWeeklyEmail" className="block text-base font-medium text-gray-900 mb-2 cursor-pointer">
                  Recibir resumen semanal por email
                </label>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Recibirás un email semanal con el resumen de tu portafolio de inversiones, 
                  incluyendo el valor actual, variaciones y TIR de tus activos.
                </p>
                <div className="mt-3">
                  <Badge variant={receiveWeeklyEmail ? 'green' : 'gray'}>
                    {receiveWeeklyEmail ? '✓ Activado' : '✗ Desactivado'}
                  </Badge>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}
            {message && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm font-medium">{message}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
              <Button 
                variant="ghost"
                size="lg"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSave}
                disabled={saving}
                loading={saving}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
