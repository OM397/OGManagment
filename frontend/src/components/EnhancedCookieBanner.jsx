import React, { useState, useEffect } from 'react';
import { Cookie, Settings, X, Shield, BarChart3, Target, Info } from 'lucide-react';

const EnhancedCookieBanner = () => {
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
      // Mostrar banner después de un pequeño delay para mejor UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Cargar preferencias guardadas
      try {
        const savedPreferences = JSON.parse(cookieConsent);
        setPreferences(savedPreferences);
      } catch (error) {
        console.warn('Error loading cookie preferences:', error);
      }
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
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
    
    // Aquí podrías activar Google Analytics u otros servicios
    // gtag('consent', 'update', { analytics_storage: 'granted' });
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
    setShowSettings(false);
    
    // Actualizar consentimiento de servicios externos
    // gtag('consent', 'update', { 
    //   analytics_storage: preferences.analytics ? 'granted' : 'denied',
    //   ad_storage: preferences.marketing ? 'granted' : 'denied'
    // });
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
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };

  const togglePreference = (type) => {
    if (type === 'essential') return; // No se puede desactivar
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const cookieTypes = [
    {
      id: 'essential',
      name: 'Cookies Esenciales',
      description: 'Necesarias para el funcionamiento básico del sitio web',
      icon: Shield,
      required: true,
      examples: ['Sesión de usuario', 'Autenticación', 'Seguridad']
    },
    {
      id: 'functional',
      name: 'Cookies de Funcionalidad',
      description: 'Mejoran la experiencia y recuerdan sus preferencias',
      icon: Settings,
      required: false,
      examples: ['Idioma preferido', 'Configuraciones de visualización', 'Preferencias de usuario']
    },
    {
      id: 'analytics',
      name: 'Cookies de Análisis',
      description: 'Nos ayudan a entender cómo utiliza el sitio web',
      icon: BarChart3,
      required: false,
      examples: ['Google Analytics', 'Métricas de rendimiento', 'Estadísticas de uso']
    },
    {
      id: 'marketing',
      name: 'Cookies de Marketing',
      description: 'Para mostrar anuncios relevantes y medir campañas',
      icon: Target,
      required: false,
      examples: ['Publicidad dirigida', 'Remarketing', 'Medición de campañas']
    }
  ];

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 max-h-[90vh] overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start space-x-4">
            <Cookie className="text-blue-600 mt-1 flex-shrink-0" size={24} />
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Gestionamos sus cookies de forma transparente
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Utilizamos cookies para mejorar su experiencia, analizar el uso del sitio y personalizar el contenido. 
                Puede elegir qué tipos de cookies aceptar. Solo las cookies esenciales son obligatorias.
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
                <div className="space-y-6">
                  <div className="space-y-4">
                    {cookieTypes.map((type) => {
                      const IconComponent = type.icon;
                      const isEnabled = preferences[type.id];
                      
                      return (
                        <div key={type.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <IconComponent size={20} className="text-blue-600" />
                                <h4 className="font-medium text-gray-900">{type.name}</h4>
                                {type.required && (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                    Obligatorio
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                              <div className="text-xs text-gray-500">
                                <strong>Ejemplos:</strong> {type.examples.join(', ')}
                              </div>
                            </div>
                            <div className="ml-4">
                              {type.required ? (
                                <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-xs font-medium">
                                  Siempre activo
                                </div>
                              ) : (
                                <button
                                  onClick={() => togglePreference(type.id)}
                                  className={`w-12 h-6 rounded-full transition-colors ${
                                    isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                                  }`}
                                >
                                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                    isEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                  }`} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Info size={16} className="text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Información importante:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Puede cambiar sus preferencias en cualquier momento</li>
                          <li>Las cookies esenciales no se pueden desactivar</li>
                          <li>Sus datos están protegidos según el RGPD</li>
                          <li>No vendemos ni compartimos sus datos personales</li>
                        </ul>
                      </div>
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

export default EnhancedCookieBanner;
