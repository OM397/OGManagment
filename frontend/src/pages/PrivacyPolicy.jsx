import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Política de Privacidad</h1>
          <p className="text-gray-600 mt-2">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Introducción */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introducción</h2>
            <p className="text-gray-700 leading-relaxed">
              Capital Tracker ("nosotros", "nuestro" o "la aplicación") se compromete a proteger su privacidad. 
              Esta Política de Privacidad explica cómo recopilamos, utilizamos, almacenamos y protegemos su información 
              personal cuando utiliza nuestra aplicación de gestión financiera.
            </p>
          </section>

          {/* Información que recopilamos */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Información que Recopilamos</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Información Personal</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Nombre y dirección de correo electrónico</li>
              <li>Información de cuenta y credenciales de acceso</li>
              <li>Datos de contacto y preferencias de comunicación</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Información Financiera</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Datos de inversiones y activos financieros</li>
              <li>Historial de transacciones y movimientos</li>
              <li>Información de propiedades inmobiliarias</li>
              <li>Datos de hipotecas y rentas</li>
              <li>Preferencias de inversión y objetivos financieros</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Información Técnica</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Dirección IP y datos de navegación</li>
              <li>Información del dispositivo y navegador</li>
              <li>Cookies y tecnologías similares</li>
              <li>Logs de actividad y uso de la aplicación</li>
            </ul>
          </section>

          {/* Cómo utilizamos la información */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Cómo Utilizamos su Información</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Proporcionar y mejorar nuestros servicios de gestión financiera</li>
              <li>Procesar transacciones y mantener registros financieros</li>
              <li>Generar análisis y reportes personalizados</li>
              <li>Enviar notificaciones importantes sobre su cuenta</li>
              <li>Cumplir con obligaciones legales y regulatorias</li>
              <li>Prevenir fraudes y proteger la seguridad de la plataforma</li>
            </ul>
          </section>

          {/* Compartir información */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Compartir Información</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              No vendemos, alquilamos ni compartimos su información personal con terceros, excepto en las siguientes circunstancias:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Con su consentimiento explícito</li>
              <li>Para cumplir con obligaciones legales</li>
              <li>Con proveedores de servicios que nos ayudan a operar la plataforma</li>
              <li>En caso de fusión, adquisición o venta de activos</li>
            </ul>
          </section>

          {/* Seguridad */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Seguridad de los Datos</h2>
            <p className="text-gray-700 leading-relaxed">
              Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger su información, 
              incluyendo encriptación de datos, controles de acceso, monitoreo de seguridad y auditorías regulares.
            </p>
          </section>

          {/* Sus derechos */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Sus Derechos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Bajo el RGPD y otras leyes de protección de datos, usted tiene los siguientes derechos:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Acceso:</strong> Solicitar una copia de sus datos personales</li>
              <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
              <li><strong>Eliminación:</strong> Solicitar la eliminación de sus datos</li>
              <li><strong>Limitación:</strong> Restringir el procesamiento de sus datos</li>
              <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
              <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies y Tecnologías Similares</h2>
            <p className="text-gray-700 leading-relaxed">
              Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el uso de la aplicación 
              y personalizar el contenido. Puede gestionar sus preferencias de cookies a través de la configuración de su navegador.
            </p>
          </section>

          {/* Retención de datos */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Retención de Datos</h2>
            <p className="text-gray-700 leading-relaxed">
              Conservamos su información personal solo durante el tiempo necesario para cumplir con los propósitos 
              descritos en esta política, cumplir con obligaciones legales y resolver disputas.
            </p>
          </section>

          {/* Menores de edad */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Menores de Edad</h2>
            <p className="text-gray-700 leading-relaxed">
              Nuestros servicios están dirigidos a personas mayores de 18 años. No recopilamos intencionalmente 
              información personal de menores de edad sin el consentimiento de sus padres o tutores legales.
            </p>
          </section>

          {/* Cambios en la política */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cambios en esta Política</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos sobre cambios 
              significativos a través de la aplicación o por correo electrónico.
            </p>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contacto</h2>
            <p className="text-gray-700 leading-relaxed">
              Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos, 
              puede contactarnos en:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@capitaltracker.app<br />
                <strong>Dirección:</strong> [Dirección de la empresa]<br />
                <strong>Teléfono:</strong> [Número de teléfono]
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
