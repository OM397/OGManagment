import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Twitter, Linkedin, Github, Cookie } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [showCookieSettings, setShowCookieSettings] = useState(false);

  const handleCookieSettings = () => {
    // Limpiar el consentimiento actual para mostrar el banner nuevamente
    localStorage.removeItem('cookieConsent');
    localStorage.removeItem('cookieConsentDate');
    setShowCookieSettings(true);
    // Recargar la página para mostrar el banner de cookies
    window.location.reload();
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Información de la empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Capital Tracker</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              La plataforma de gestión financiera más completa para inversores y propietarios de bienes raíces.
            </p>
            <div className="flex space-x-4">
              <div className="text-gray-400">
                <Twitter size={20} />
              </div>
              <div className="text-gray-400">
                <Linkedin size={20} />
              </div>
              <div className="text-gray-400">
                <Github size={20} />
              </div>
            </div>
          </div>

          {/* Enlaces legales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Política de Cookies
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Aviso Legal
                </a>
              </li>
            </ul>
          </div>

          {/* Soporte */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Soporte</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Centro de Ayuda
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Documentación
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Estado del Servicio
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Reportar un Problema
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-gray-400" />
                <a href="mailto:info@capitaltracker.app" className="text-gray-300 hover:text-white transition-colors text-sm">
                  info@capitaltracker.app
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} Capital Tracker. Todos los derechos reservados.
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCookieSettings}
                className="text-gray-400 hover:text-white text-sm flex items-center transition-colors"
              >
                <Cookie size={14} className="mr-1" />
                Configurar cookies
              </button>
              <div className="text-gray-400 text-sm">
                Hecho con ❤️ para inversores inteligentes
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
