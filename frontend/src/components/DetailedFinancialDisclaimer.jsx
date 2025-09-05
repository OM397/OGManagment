import React, { useState } from 'react';
import { AlertTriangle, X, ExternalLink, FileText, TrendingUp, Shield } from 'lucide-react';

const DetailedFinancialDisclaimer = ({ show = true, onClose, compact = false }) => {
  const [isVisible, setIsVisible] = useState(show);
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  if (compact) {
    return (
      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-4">
        <div className="flex items-center">
          <AlertTriangle className="h-4 w-4 text-amber-400 mr-2" />
          <p className="text-sm text-amber-700">
            <strong>Descargo:</strong> Esta información es únicamente para fines informativos. 
            No constituye asesoramiento financiero.
          </p>
          <button
            onClick={handleClose}
            className="ml-auto text-amber-600 hover:text-amber-800"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="h-6 w-6 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-semibold text-amber-800 mb-3">
            Descargo de Responsabilidad Financiera
          </h3>
          
          <div className="space-y-4 text-sm text-amber-700">
            <div className="bg-amber-100 border border-amber-300 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Importante - Lea Antes de Continuar
              </h4>
              <p className="mb-3">
                <strong>Capital Tracker es únicamente una herramienta de gestión financiera personal.</strong> 
                No proporcionamos asesoramiento financiero, de inversión, fiscal o legal.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-amber-800 mb-2">⚠️ Limitaciones de la Información:</h5>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Los precios pueden tener retrasos y no son en tiempo real</li>
                    <li>Los datos históricos no garantizan rendimientos futuros</li>
                    <li>Las proyecciones son estimaciones, no predicciones</li>
                    <li>No consideramos su situación financiera personal</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-amber-800 mb-2">📊 Riesgos de Inversión:</h5>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Todas las inversiones conllevan riesgo de pérdida</li>
                    <li>Los mercados pueden ser volátiles e impredecibles</li>
                    <li>Los resultados pasados no garantizan resultados futuros</li>
                    <li>La diversificación no elimina el riesgo de pérdida</li>
                  </ul>
                </div>
              </div>
            </div>

            {!showFullDisclaimer ? (
              <button
                onClick={() => setShowFullDisclaimer(true)}
                className="text-amber-600 hover:text-amber-800 font-medium underline flex items-center"
              >
                <FileText className="h-4 w-4 mr-1" />
                Leer descargo completo
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-white border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Descargo Completo
                  </h4>
                  
                  <div className="space-y-3 text-xs">
                    <div>
                      <h5 className="font-medium text-amber-800">1. Naturaleza de la Información</h5>
                      <p className="text-amber-700">
                        Toda la información, análisis, gráficos y datos mostrados en esta aplicación 
                        son únicamente para fines informativos y educativos. No constituyen asesoramiento 
                        financiero, de inversión, fiscal o legal de ningún tipo.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-amber-800">2. Limitaciones de Datos</h5>
                      <p className="text-amber-700">
                        Los precios de mercado pueden tener retrasos de hasta 15 minutos o más. 
                        Los datos históricos y proyecciones son estimaciones basadas en información 
                        disponible públicamente y no deben utilizarse para transacciones en tiempo real.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-amber-800">3. Responsabilidad del Usuario</h5>
                      <p className="text-amber-700">
                        Usted es completamente responsable de todas las decisiones de inversión y 
                        transacciones financieras. Debe realizar su propia investigación y consultar 
                        con asesores financieros profesionales antes de tomar cualquier decisión.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-amber-800">4. Exclusión de Garantías</h5>
                      <p className="text-amber-700">
                        No garantizamos la exactitud, completitud o actualidad de la información. 
                        No seremos responsables por pérdidas financieras derivadas del uso de esta aplicación.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-100 border border-amber-300 rounded-lg p-3">
                  <p className="text-xs text-amber-800 font-medium">
                    <strong>Recomendación:</strong> Consulte siempre con un asesor financiero certificado 
                    antes de tomar decisiones de inversión importantes.
                  </p>
                </div>
                
                <button
                  onClick={() => setShowFullDisclaimer(false)}
                  className="text-amber-600 hover:text-amber-800 font-medium text-xs underline"
                >
                  Ocultar descargo completo
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleClose}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors flex items-center"
            >
              <X size={16} className="mr-1" />
              Entendido
            </button>
            <a
              href="/terms-of-service"
              className="text-amber-600 hover:text-amber-800 text-sm font-medium flex items-center"
            >
              <ExternalLink size={16} className="mr-1" />
              Ver términos completos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedFinancialDisclaimer;
