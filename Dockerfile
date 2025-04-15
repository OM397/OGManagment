# Dockerfile

# --- Build frontend ---
    FROM node:20-alpine AS frontend-builder
    WORKDIR /frontend
    COPY frontend/ ./
    RUN npm install && npm run build
    
    # --- Backend ---
        FROM node:20-alpine AS backend
    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install
    
    # ✅ Copy backend code and server entry
    COPY backend/server.js ./

    COPY backend ./backend
    COPY frontend ./frontend
    
    # ✅ Copy built frontend into public dir
    COPY --from=frontend-builder /frontend/dist ./public
    
    # Expose and start app
    EXPOSE 3000
    CMD ["node", "server.js"]
    
    RUN ls -la /app
