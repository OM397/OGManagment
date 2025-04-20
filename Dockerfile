# --- Build frontend ---
    FROM node:20-alpine AS frontend-builder
    WORKDIR /frontend
    
    # Solo se copian los package.json primero para optimizar cache de dependencias
    COPY frontend/package*.json ./
    RUN npm install
    
    # Copiamos el resto del frontend (ya sin .env.production)
    COPY frontend/ ./
    RUN npm run build
    
    
    # --- Backend ---
    FROM node:20-alpine AS backend
    WORKDIR /app
    
    COPY backend/package*.json ./
    RUN npm install
    
    # Copiamos el resto del backend
    COPY backend/ ./
    
    # Copiamos build del frontend al public del backend
    COPY --from=frontend-builder /frontend/dist ./public
    
#EXPOSE 3000
    EXPOSE 8080

    
    CMD ["node", "server.js"]
    