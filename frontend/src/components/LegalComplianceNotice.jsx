import React, { useState } from 'react';
import { Scale, FileText, Shield, CheckCircle, ExternalLink } from 'lucide-react';

const LegalComplianceNotice = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <Scale className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-green-800">
            Cumplimiento Legal y Transparencia
          </h3>
          <div className="mt-2 text-sm text-green-700">
            <p className="mb-2">
              Capital Tracker cumple con todas las regulaciones de protección de datos y transparencia financiera.
            </p>
            
            {!showDetails ? (
              <button
                onClick={() => setShowDetails(true)}
                className="text-green-600 hover:text-green-800 font-medium underline"
              >
                Ver certificaciones y cumplimiento
              </button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">RGPD Compliant</h4>
                      <p className="text-xs text-green-600">Cumplimiento total con el Reglamento General de Protección de Datos</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <FileText className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">Transparencia Total</h4>
                      <p className="text-xs text-green-600">Políticas claras y accesibles en todo momento</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">Auditorías Regulares</h4>
                      <p className="text-xs text-green-600">Revisiones periódicas de seguridad y cumplimiento</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <ExternalLink className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">Derechos del Usuario</h4>
                      <p className="text-xs text-green-600">Acceso, rectificación, eliminación y portabilidad</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-green-200">
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="/privacy-policy"
                      className="text-xs text-green-600 hover:text-green-800 underline"
                    >
                      Política de Privacidad
                    </a>
                    <span className="text-green-400">•</span>
                    <a
                      href="/terms-of-service"
                      className="text-xs text-green-600 hover:text-green-800 underline"
                    >
                      Términos y Condiciones
                    </a>
                    <span className="text-green-400">•</span>
                    <a
                      href="/cookie-policy"
                      className="text-xs text-green-600 hover:text-green-800 underline"
                    >
                      Política de Cookies
                    </a>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-green-600 hover:text-green-800 font-medium text-xs underline"
                >
                  Ocultar detalles
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-3">
            <button
              onClick={() => setIsVisible(false)}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalComplianceNotice;
