# --- Build frontend ---
    FROM node:20-alpine AS frontend-builder
    WORKDIR /frontend
    COPY frontend/package*.json ./
    RUN npm install
    COPY frontend/ ./
    RUN npm run build
    
    # --- Backend ---
    FROM node:20-alpine AS backend
    WORKDIR /app
    
    COPY backend/package*.json ./
    RUN npm install
    
    COPY backend/server.js ./
    COPY backend ./backend
    COPY frontend ./frontend
    
    # ✅ Copy built frontend into public dir
    COPY --from=frontend-builder /frontend/dist ./public
    
    # ✅ Check if frontend build files exist
    RUN ls -la /app/public
    
    EXPOSE 3000
    RUN find /app/public -type f

    CMD ["node", "server.js"]
    