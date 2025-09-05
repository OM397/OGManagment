import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">Términos y Condiciones</h1>
          <p className="text-gray-600 mt-2">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Introducción */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
            <p className="text-gray-700 leading-relaxed">
              Al acceder y utilizar Capital Tracker ("la aplicación", "nuestro servicio"), usted acepta estar 
              sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, 
              no debe utilizar nuestro servicio.
            </p>
          </section>

          {/* Descripción del servicio */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descripción del Servicio</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Capital Tracker es una aplicación de gestión financiera personal que permite a los usuarios:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Gestionar y hacer seguimiento de sus inversiones</li>
              <li>Monitorear activos financieros en tiempo real</li>
              <li>Analizar el rendimiento de su portafolio</li>
              <li>Gestionar propiedades inmobiliarias y sus rentas</li>
              <li>Generar reportes y análisis financieros</li>
            </ul>
          </section>

          {/* Elegibilidad */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Elegibilidad</h2>
            <p className="text-gray-700 leading-relaxed">
              Para utilizar nuestro servicio, debe ser mayor de 18 años y tener la capacidad legal para celebrar 
              contratos vinculantes. Al registrarse, declara y garantiza que cumple con estos requisitos.
            </p>
          </section>

          {/* Cuenta de usuario */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cuenta de Usuario</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Registro</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para acceder a ciertas funciones, debe crear una cuenta proporcionando información precisa y actualizada.
            </p>

            <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Responsabilidades del Usuario</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Mantener la confidencialidad de sus credenciales de acceso</li>
              <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
              <li>Proporcionar información precisa y actualizada</li>
              <li>Ser responsable de todas las actividades en su cuenta</li>
            </ul>
          </section>

          {/* Uso aceptable */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Uso Aceptable</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Usted se compromete a utilizar el servicio de manera responsable y legal. Está prohibido:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Utilizar el servicio para actividades ilegales o fraudulentas</li>
              <li>Intentar acceder a cuentas de otros usuarios</li>
              <li>Interferir con el funcionamiento del servicio</li>
              <li>Transmitir virus, malware o código malicioso</li>
              <li>Violar derechos de propiedad intelectual</li>
              <li>Utilizar el servicio para spam o comunicaciones no solicitadas</li>
            </ul>
          </section>

          {/* Información financiera */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Información Financiera</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Precisión de los Datos</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Es su responsabilidad proporcionar información financiera precisa y actualizada. 
              No somos responsables de decisiones tomadas basándose en información incorrecta.
            </p>

            <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 No Somos Asesores Financieros</h3>
            <p className="text-gray-700 leading-relaxed">
              Capital Tracker es una herramienta de gestión, no un asesor financiero. 
              Toda la información proporcionada es únicamente para fines informativos y no constituye 
              asesoramiento financiero, de inversión o fiscal.
            </p>
          </section>

          {/* Propiedad intelectual */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Propiedad Intelectual</h2>
            <p className="text-gray-700 leading-relaxed">
              El servicio y su contenido original, características y funcionalidad son propiedad de Capital Tracker 
              y están protegidos por leyes de derechos de autor, marcas registradas y otras leyes de propiedad intelectual.
            </p>
          </section>

          {/* Privacidad */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacidad</h2>
            <p className="text-gray-700 leading-relaxed">
              Su privacidad es importante para nosotros. Nuestra recopilación y uso de información personal 
              se rige por nuestra Política de Privacidad, que forma parte integral de estos términos.
            </p>
          </section>

          {/* Limitación de responsabilidad */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitación de Responsabilidad</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, CAPITAL TRACKER NO SERÁ RESPONSABLE POR:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Pérdidas financieras derivadas del uso del servicio</li>
              <li>Interrupciones del servicio o pérdida de datos</li>
              <li>Decisiones de inversión tomadas basándose en la información del servicio</li>
              <li>Daños indirectos, incidentales o consecuenciales</li>
            </ul>
          </section>

          {/* Modificaciones del servicio */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Modificaciones del Servicio</h2>
            <p className="text-gray-700 leading-relaxed">
              Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en cualquier momento, 
              con o sin previo aviso. No seremos responsables ante usted o terceros por cualquier modificación, 
              suspensión o discontinuación del servicio.
            </p>
          </section>

          {/* Terminación */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Terminación</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos terminar o suspender su cuenta inmediatamente, sin previo aviso, por cualquier motivo, 
              incluyendo la violación de estos términos. Usted puede terminar su cuenta en cualquier momento 
              contactándonos.
            </p>
          </section>

          {/* Ley aplicable */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Ley Aplicable</h2>
            <p className="text-gray-700 leading-relaxed">
              Estos términos se rigen por las leyes de [Jurisdicción]. Cualquier disputa será resuelta 
              en los tribunales competentes de [Ciudad, País].
            </p>
          </section>

          {/* Cambios en los términos */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Cambios en los Términos</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos actualizar estos términos ocasionalmente. Los cambios entrarán en vigor inmediatamente 
              después de su publicación. Su uso continuado del servicio constituye la aceptación de los términos modificados.
            </p>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contacto</h2>
            <p className="text-gray-700 leading-relaxed">
              Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos en:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@capitaltracker.app<br />
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

export default TermsOfService;
