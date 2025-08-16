# Kubera MVP Frontend

## Instalación y ejecución

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en:

```
http://localhost:5173/
```

---

# Kubera MVP Backend

## Instalación y ejecución

```bash
cd backend
npm install axios express cors
node server.js
```

El backend estará disponible en:

```
http://localhost:3001/api/market-data
```

---


---

## Uso de Variables de Entorno

El archivo `.env` en `/backend` contiene la clave RapidAPI:

```
RAPIDAPI_KEY=TU_CLAVE
```

Puedes cambiar tu clave ahí sin modificar el código.
