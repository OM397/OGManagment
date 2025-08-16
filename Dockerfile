# Lean multi-stage build focused on minimizing memory usage (avoid apk upgrade & duplicate layers)
ARG NODE_VERSION=20.17.0

# ---------- Base deps layer (only installs once if package manifests unchanged) ----------
FROM node:${NODE_VERSION}-alpine3.20 AS deps
ENV npm_config_loglevel=warn \
        NPM_CONFIG_FUND=false \
        NPM_CONFIG_AUDIT=false
WORKDIR /workspace

# Copy manifests first for better layer caching
COPY frontend/package*.json frontend/
COPY backend/package*.json backend/

# Install frontend (needs dev deps to build) & backend (prod only)
RUN cd frontend \
    && npm ci --no-audit --no-fund \  
    && cd ../backend \
    && npm ci --omit=dev --no-audit --no-fund \
    && cd .. \
    && npm cache clean --force

# ---------- Build frontend ----------
FROM node:${NODE_VERSION}-alpine3.20 AS frontend-build
ENV NODE_ENV=production
WORKDIR /workspace
# Copy application source first (without node_modules due to .dockerignore)
COPY frontend/ ./frontend
# Then bring in pre-installed node_modules from deps stage (avoid overwrite issue)
COPY --from=deps /workspace/frontend/node_modules ./frontend/node_modules
RUN cd frontend && npm run build

# ---------- Final runtime image ----------
FROM node:${NODE_VERSION}-alpine3.20 AS runtime
ENV NODE_ENV=production \
        npm_config_loglevel=warn
WORKDIR /app

# Copy backend node_modules & source (keep prod deps only)
COPY --from=deps /workspace/backend/node_modules ./node_modules
COPY backend/ ./

# Copy built frontend assets
COPY --from=frontend-build /workspace/frontend/dist ./public

# Use non-root user
USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/ping', r=>{if(r.statusCode===200)process.exit(0);process.exit(1)}).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
    