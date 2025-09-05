import React, { useState } from 'react';
import { Shield, Lock, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

const SecurityNotice = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Seguridad y Protección de Datos
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p className="mb-2">
              Su información financiera está protegida con las mejores prácticas de seguridad:
            </p>
            
            {!showDetails ? (
              <button
                onClick={() => setShowDetails(true)}
                className="text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Ver detalles de seguridad
              </button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <Lock className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Encriptación</h4>
                      <p className="text-xs text-blue-600">Datos encriptados en tránsito y reposo</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Eye className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Privacidad</h4>
                      <p className="text-xs text-blue-600">Solo usted puede ver sus datos</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Cumplimiento</h4>
                      <p className="text-xs text-blue-600">RGPD y estándares internacionales</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Monitoreo</h4>
                      <p className="text-xs text-blue-600">Detección de accesos no autorizados</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-blue-200">
                  <p className="text-xs text-blue-600">
                    <strong>Importante:</strong> Nunca compartimos sus datos financieros con terceros. 
                    Utilizamos servicios de datos de mercado solo para obtener precios públicos.
                  </p>
                </div>
                
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-blue-600 hover:text-blue-800 font-medium text-xs underline"
                >
                  Ocultar detalles
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-3">
            <button
              onClick={() => setIsVisible(false)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityNotice;
