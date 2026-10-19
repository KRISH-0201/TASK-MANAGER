# ========================================================
# Practical 11: Containerization with Docker & Docker Compose
# Service: Backend REST API (Node.js & Express)
# Base Image: Lightweight Node.js 20 on Alpine Linux
# ========================================================

FROM node:20-alpine

# Install curl for healthcheck validation
RUN apk add --no-cache curl

# Set working directory inside container
WORKDIR /usr/src/app

# Set production environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    DOCKER_CONTAINER=true

# Copy package manifests for efficient layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Copy application source code
COPY . .

# Switch to unprivileged non-root user for security
USER node

# Expose internal API port
EXPOSE 5000

# Health check to verify API responsiveness inside container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start Node.js Express server
CMD ["node", "server.js"]
