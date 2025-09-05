import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CookiePolicy = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">Política de Cookies</h1>
          <p className="text-gray-600 mt-2">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Introducción */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. ¿Qué son las Cookies?</h2>
            <p className="text-gray-700 leading-relaxed">
              Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita nuestro sitio web. 
              Nos ayudan a mejorar su experiencia de navegación, recordar sus preferencias y analizar cómo utiliza nuestro servicio.
            </p>
          </section>

          {/* Tipos de cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Tipos de Cookies que Utilizamos</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Cookies Esenciales</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Estas cookies son necesarias para el funcionamiento básico del sitio web y no se pueden desactivar.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Cookies de sesión:</strong> Mantienen su sesión activa mientras navega</li>
              <li><strong>Cookies de seguridad:</strong> Protegen contra ataques y fraudes</li>
              <li><strong>Cookies de autenticación:</strong> Recuerdan que ha iniciado sesión</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Cookies de Funcionalidad</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Estas cookies mejoran la funcionalidad del sitio web y personalizan su experiencia.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Preferencias de usuario:</strong> Recuerdan sus configuraciones</li>
              <li><strong>Idioma y región:</strong> Mantienen sus preferencias de localización</li>
              <li><strong>Configuraciones de visualización:</strong> Recuerdan cómo prefiere ver los datos</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Cookies de Análisis</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Estas cookies nos ayudan a entender cómo los usuarios interactúan con nuestro sitio web.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Google Analytics:</strong> Analiza el tráfico y comportamiento de usuarios</li>
              <li><strong>Métricas de rendimiento:</strong> Miden la velocidad y funcionamiento del sitio</li>
              <li><strong>Estadísticas de uso:</strong> Recopilan datos sobre las funciones más utilizadas</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">2.4 Cookies de Marketing</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Estas cookies se utilizan para mostrar anuncios relevantes y medir la efectividad de nuestras campañas.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Publicidad dirigida:</strong> Muestran anuncios basados en sus intereses</li>
              <li><strong>Remarketing:</strong> Le muestran anuncios cuando visita otros sitios</li>
              <li><strong>Medición de campañas:</strong> Evalúan la efectividad de nuestras promociones</li>
            </ul>
          </section>

          {/* Cookies específicas */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Cookies Específicas que Utilizamos</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propósito</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duración</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">session_id</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Mantiene la sesión del usuario</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Sesión</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Esencial</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">auth_token</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Token de autenticación</td>
                    <td className="px-4 py-3 text-sm text-gray-700">30 días</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Esencial</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">user_preferences</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Preferencias de visualización</td>
                    <td className="px-4 py-3 text-sm text-gray-700">1 año</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Funcionalidad</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">_ga</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Google Analytics</td>
                    <td className="px-4 py-3 text-sm text-gray-700">2 años</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Análisis</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Gestión de cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cómo Gestionar las Cookies</h2>
            
            <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Configuración del Navegador</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Puede controlar y eliminar cookies a través de la configuración de su navegador:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li><strong>Chrome:</strong> Configuración > Privacidad y seguridad > Cookies</li>
              <li><strong>Firefox:</strong> Opciones > Privacidad y seguridad > Cookies</li>
              <li><strong>Safari:</strong> Preferencias > Privacidad > Cookies</li>
              <li><strong>Edge:</strong> Configuración > Cookies y permisos del sitio</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Banner de Cookies</h3>
            <p className="text-gray-700 leading-relaxed">
              Cuando visite nuestro sitio por primera vez, verá un banner que le permite elegir qué tipos de cookies acepta. 
              Puede cambiar sus preferencias en cualquier momento.
            </p>
          </section>

          {/* Cookies de terceros */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookies de Terceros</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Algunos servicios de terceros que utilizamos pueden establecer sus propias cookies:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Google Analytics:</strong> Para análisis de tráfico web</li>
              <li><strong>Proveedores de datos financieros:</strong> Para obtener precios de mercado</li>
              <li><strong>Servicios de mapas:</strong> Para mostrar ubicaciones de propiedades</li>
            </ul>
          </section>

          {/* Impacto de desactivar cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Impacto de Desactivar Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Si desactiva las cookies, algunas funciones de nuestro sitio web pueden no funcionar correctamente. 
              Las cookies esenciales son necesarias para el funcionamiento básico del servicio.
            </p>
          </section>

          {/* Actualizaciones */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Actualizaciones de esta Política</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos actualizar esta Política de Cookies ocasionalmente para reflejar cambios en nuestras prácticas 
              o por otros motivos operativos, legales o regulatorios.
            </p>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contacto</h2>
            <p className="text-gray-700 leading-relaxed">
              Si tiene preguntas sobre nuestra Política de Cookies, puede contactarnos en:
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

export default CookiePolicy;
