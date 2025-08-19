## API de CapitalTracker (Kubera MVP)

Documento único con el funcionamiento actual de las APIs. Este monorepo expone un backend Express con caché en Redis y MongoDB, y sirve un frontend estático. Aquí se describe únicamente el contrato de la API.

### Autenticación y sesiones
- Modelo: JWT con cookies HttpOnly. En producción se usan cookies host-only con prefijo `__Host-`.
	- Acceso: `__Host-accessToken` (15 min).
	- Refresh: `__Host-refreshToken` (7 días).
	- En desarrollo: `accessToken` y `refreshToken` (sin prefijo).
- En cada request del cliente, enviar credenciales: include (cookies). También se acepta header `Authorization: Bearer <accessToken>` como alternativa.
- Respuestas comunes cuando expira/falta el token:
	- 401 `{ code: 'MISSING_TOKEN' | 'TOKEN_EXPIRED', requiresRefresh: true }` → el cliente debe llamar a /api/refresh.
	- 401 `{ code: 'SESSION_NOT_FOUND', requiresRefresh: true }` → sesión revocada; refrescar o re-login.
	- 403 `{ error: 'Token inválido' }`.

Roles: `user`, `admin`, `readonly`. Las rutas de admin requieren ambos middlewares: auth + isAdmin.

---

## Endpoints públicos (sin auth)
- GET `/api/ping` → `{ ok: true, ts }`.
- GET `/api/build-info` → `{ commit, builtAt, runtime }`.
- GET `/api/metrics` → métricas básicas del proceso.
- GET `/api/tickers` → listado base de activos soportados.
- GET `/api/search-stocks?q=...` → búsqueda de acciones.
- POST `/api/market-data` → precios actuales por lote.
	- Body: `[{ id: string, type: 'crypto' | 'stock' }]`.
	- Respuesta: `{ data: { cryptos, stocks, idMap }, source: 'live'|'cache', fetchedAt }`.
- GET `/api/market-summary` → resumen de mercado.
- GET `/api/fx?currencies=USD,GBP,...` → tipos de cambio base EUR.
- GET `/api/history?id=<id>&type=crypto|stock&days=30` → histórico compacto por activo.
- GET `/api/performance` → datos agregados de performance.

Notas de caché (servidor):
- Precios: TTL ~15m (frescura ~3m). Multi-proveedor con fallback.
- FX: TTL ~1h; origen principal Frankfurter. Admin ve “Fuente FX” y “Fuente Cache FX”.
- Históricos: TTL ~24h.

---

## Autenticación
- POST `/api/register`
	- Crea usuario auto-aprobado. En entornos sin correo, el envío puede simularse.
- POST `/api/login`
	- Establece cookies de acceso/refresh y devuelve `{ uid, role, tokenId, lastLogin [, accessToken en dev] }`.
- POST `/api/refresh`
	- Rota tokens. Respuesta `{ success: true, tokenId }` y set de nuevas cookies.
- POST `/api/logout`
	- Revoca la sesión actual y limpia cookies.
- GET `/api/sessions`
	- Lista sesiones activas del usuario actual (usando refresh cookie).
- DELETE `/api/sessions/:sessionId`
	- Revoca una sesión específica.
- POST `/api/logout-all`
	- Revoca todas las sesiones del usuario actual y limpia cookies.
- POST `/api/forgot-password`
	- Regenera una contraseña temporal y la envía por correo.

---

## Rutas de usuario (requieren auth)
- GET `/api/user` → `{ uid, role, maskedEmail }`.
- GET `/api/user-data` → retorna los datos normalizados del usuario.
- POST `/api/user-data` → guarda datos normalizados; intenta auto-detectar `initialCurrency` por activo.
- POST `/api/change-password` → cambia contraseña con la actual y la nueva.
- GET `/api/email-preference` → `{ receiveWeeklyEmail }`.
- POST `/api/email-preference` → activa/desactiva el resumen semanal por correo.

---

## Análisis de inversiones (requiere auth)
- GET `/api/investments/irr` → IRR de las inversiones del usuario.

---

## Configuración de mailing
- GET `/api/mailing-config` → `{ schedule: { weekdays: number[], hour: number }, mailBody }`.
- POST `/api/mailing-config` → actualiza `schedule` y opcionalmente `mailBody`.
	- Nota: actualmente no requiere auth; se recomienda protegerla en futuras versiones.

---

## Rutas de admin (requieren auth + admin)
- GET `/api/admin-only` → verificación rápida de rol admin.
- Gestión de usuarios:
	- GET `/api/admin/users` → lista usuarios.
	- PATCH `/api/admin/users/:username/weekly-email` → cambia preferencia semanal.
	- PATCH `/api/admin/users/:username/role` → cambia rol (`admin|user|readonly`).
	- PATCH `/api/admin/users/:username/approve` → aprueba usuario.
	- PATCH `/api/admin/users/:username/block` → bloquea/desbloquea usuario.
	- DELETE `/api/admin/users/:username` → elimina usuario.
- Overview de inversiones:
	- GET `/api/admin/investments/overview` → lista plana con precio EUR, fuentes de datos, FX (incluye `fxCacheSource`), market cap y mini-histórico.
- Dashboard y salud:
	- GET `/api/admin/dashboard/active-users`
	- GET `/api/admin/dashboard/recent-errors`
	- GET `/api/admin/dashboard/resource-usage`
	- GET `/api/admin/dashboard/api-calls`
	- GET `/api/admin/dashboard/services-status`
	- POST `/api/admin/dashboard/touch-logs` (graba logs enviados por el cliente)
	- GET `/api/admin/dashboard/touch-logs` (lee últimos logs)
- Mailing manual:
	- POST `/api/admin/manual-mailing` → ejecuta envío del resumen semanal.

---

## Ejemplos de uso (resúmenes)
- POST `/api/market-data`
	- Body: `[{ "id": "AAPL", "type": "stock" }, { "id": "bitcoin", "type": "crypto" }]`
	- 200: `{ data: { stocks: { aapl: { rawPrice, currency, eur } }, cryptos: { bitcoin: { eur } } }, source, fetchedAt }`
- GET `/api/fx?currencies=USD,GBP`
	- 200: `{ rates: { USD: 1.09, GBP: 0.85 }, source: 'live'|'cache', fetchedAt }`
- GET `/api/history?id=MSFT&type=stock&days=30`
	- 200: `{ history: [{ date, price }...], currency: 'USD' }`

---

## Variables de entorno (backend)
Ejemplo `.env` en `/backend`:

### Google Sign-In

Para habilitar login con Google:

- En backend, define en `.env`:
	- `GOOGLE_CLIENT_ID=<tu_client_id_de_oauth2>`
	- Asegúrate de tener `JWT_SECRET` y `MONGODB_URI` configurados.
- En frontend, define en `.env` (Vite):
	- `VITE_GOOGLE_CLIENT_ID=<tu_client_id_de_oauth2>`

El flujo usa Google Identity Services (ID token) y un endpoint `/api/google-login` que verifica el token y crea/inicia sesión de usuario con cookies httpOnly.


---

Actualizado: 2025-08-16