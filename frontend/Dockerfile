# ========================================================
# Practical 11: Containerization with Docker & Docker Compose
# Service: Frontend React Client (Vite Single Page App)
# Multi-Stage Build: Node 20 (Build) -> Nginx Alpine (Serve)
# ========================================================

# --- Stage 1: Build the Vite production bundle ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests for layer caching
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy source code and build config
COPY . .

# Build production artifacts into /app/dist
RUN npm run build

# --- Stage 2: Serve production assets with Nginx ---
FROM nginx:alpine

# Install curl for container health check
RUN apk add --no-cache curl

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Healthcheck to verify Nginx web server status
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/healthz || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
