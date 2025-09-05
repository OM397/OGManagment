import React, { useState, useEffect } from 'react';
import { X, Cookie, Settings } from 'lucide-react';

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Siempre activas
    functional: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Verificar si el usuario ya ha tomado una decisión sobre cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allPreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    setPreferences(allPreferences);
    localStorage.setItem('cookieConsent', JSON.stringify(allPreferences));
    setShowBanner(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleRejectAll = () => {
    const minimalPreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    setPreferences(minimalPreferences);
    localStorage.setItem('cookieConsent', JSON.stringify(minimalPreferences));
    setShowBanner(false);
  };

  const togglePreference = (type) => {
    if (type === 'essential') return; // No se puede desactivar
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start space-x-4">
            <Cookie className="text-blue-600 mt-1 flex-shrink-0" size={24} />
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Utilizamos cookies para mejorar su experiencia
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Utilizamos cookies esenciales para el funcionamiento del sitio y cookies opcionales para análisis y personalización. 
                Puede elegir qué cookies aceptar.
              </p>
              
              {!showSettings ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleAcceptAll}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Aceptar todas
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center"
                  >
                    <Settings size={16} className="mr-2" />
                    Personalizar
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:text-gray-800 transition-colors"
                  >
                    Solo esenciales
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Cookies Esenciales</h4>
                        <p className="text-sm text-gray-600">Necesarias para el funcionamiento básico del sitio</p>
                      </div>
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        Siempre activas
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Cookies de Funcionalidad</h4>
                        <p className="text-sm text-gray-600">Mejoran la experiencia y recuerdan sus preferencias</p>
                      </div>
                      <button
                        onClick={() => togglePreference('functional')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          preferences.functional ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          preferences.functional ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Cookies de Análisis</h4>
                        <p className="text-sm text-gray-600">Nos ayudan a entender cómo utiliza el sitio</p>
                      </div>
                      <button
                        onClick={() => togglePreference('analytics')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          preferences.analytics ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          preferences.analytics ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Cookies de Marketing</h4>
                        <p className="text-sm text-gray-600">Para mostrar anuncios relevantes</p>
                      </div>
                      <button
                        onClick={() => togglePreference('marketing')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          preferences.marketing ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          preferences.marketing ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAcceptSelected}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Guardar preferencias
                    </button>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:text-gray-800 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowBanner(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieBanner;
