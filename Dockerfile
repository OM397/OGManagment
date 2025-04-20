# --- Build frontend ---
    FROM node:20-alpine AS frontend-builder
    WORKDIR /frontend
    
    COPY frontend/package*.json ./
    COPY frontend/.env.production .env.production
    RUN npm install
    
    COPY frontend/ ./
    RUN npm run build
    
    
    # --- Backend ---
    FROM node:20-alpine AS backend
    WORKDIR /app
    
    COPY backend/package*.json ./
    RUN npm install
    
    # ✅ Correctly copy backend flat
    COPY backend/ ./
    
    # ✅ Copy frontend build
    COPY --from=frontend-builder /frontend/dist ./public
    
    EXPOSE 3000
    
    CMD ["node", "server.js"]
    