import React, { useState } from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

const FinancialDisclaimer = ({ show = true, onClose }) => {
  const [isVisible, setIsVisible] = useState(show);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            Aviso Importante - Descargo de Responsabilidad Financiera
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p className="mb-2">
              <strong>Capital Tracker es únicamente una herramienta de gestión financiera personal.</strong> 
              No proporcionamos asesoramiento financiero, de inversión o fiscal.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Toda la información mostrada es únicamente para fines informativos</li>
              <li>Los precios de mercado pueden tener retrasos y no deben usarse para transacciones en tiempo real</li>
              <li>Las inversiones conllevan riesgos y pueden resultar en pérdidas</li>
              <li>Consulte siempre con un asesor financiero profesional antes de tomar decisiones de inversión</li>
              <li>Los resultados pasados no garantizan resultados futuros</li>
            </ul>
            <p className="mt-2">
              Al utilizar esta aplicación, reconoce que ha leído y entendido este descargo de responsabilidad.
            </p>
          </div>
          <div className="mt-3">
            <div className="flex space-x-3">
              <a
                href="#"
                className="text-sm font-medium text-amber-800 hover:text-amber-900 flex items-center"
              >
                Leer términos completos
                <ExternalLink size={14} className="ml-1" />
              </a>
              <button
                onClick={handleClose}
                className="text-sm font-medium text-amber-800 hover:text-amber-900 flex items-center"
              >
                Entendido
                <X size={14} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDisclaimer;
