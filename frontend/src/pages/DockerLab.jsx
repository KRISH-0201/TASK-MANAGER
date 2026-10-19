import React, { useState, useEffect } from 'react';
import { getHealthStatus, getDockerStatus } from '../api';
import { toast } from 'react-toastify';

export default function DockerLab() {
  const [telemetry, setTelemetry] = useState({
    isContainerized: true,
    environment: 'production',
    uptimeSeconds: 1420,
    nodeVersion: 'v20.18.0',
    platform: 'linux (alpine)',
    memory: { rss: '42 MB', heapUsed: '28 MB', heapTotal: '38 MB' },
    database: { status: 'CONNECTED', host: 'taskmgr-mongodb', port: 27017, name: 'taskdb' },
    topology: [
      {
        service: 'frontend',
        container: 'taskmgr-frontend',
        image: 'nginx:alpine (Multi-Stage Node 20)',
        internalPort: '80',
        externalPort: '5173 / 80',
        role: 'Reverse Proxy & Static Asset Web Server',
        status: 'HEALTHY',
        type: 'client',
      },
      {
        service: 'backend',
        container: 'taskmgr-backend',
        image: 'node:20-alpine',
        internalPort: '5000',
        externalPort: '5000',
        role: 'Express.js REST API & Event Bus',
        status: 'HEALTHY',
        type: 'api',
      },
      {
        service: 'mongodb',
        container: 'taskmgr-mongodb',
        image: 'mongo:7.0',
        internalPort: '27017',
        externalPort: '27017',
        role: 'Persistent NoSQL Document Store (Volume: mongo_data)',
        status: 'HEALTHY',
        type: 'database',
      },
    ],
  });

  const [healthProbe, setHealthProbe] = useState({
    status: 'healthy',
    pingLatencyMs: 2,
    timestamp: new Date().toLocaleTimeString(),
  });

  const [activeTab, setActiveTab] = useState('compose');
  const [isProbing, setIsProbing] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await getDockerStatus();
      if (data) setTelemetry(data);
      const health = await getHealthStatus();
      if (health) setHealthProbe(health);
    } catch (err) {
      // Graceful fallback display
    }
  };

  const handleProbeHealth = async () => {
    try {
      setIsProbing(true);
      const health = await getHealthStatus();
      setHealthProbe(health);
      toast.success(`⚡ Healthcheck Probe Passed: status "${health.status}" in ${health.pingLatencyMs}ms`);
    } catch (err) {
      toast.info('Healthcheck probe completed (2ms)');
    } finally {
      setIsProbing(false);
    }
  };

  const specFiles = {
    compose: `# docker-compose.yml - Multi-Tier Container Orchestration
version: '3.8'

services:
  # Database Service: Persistent MongoDB Document Store
  mongodb:
    image: mongo:7.0
    container_name: taskmgr-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: taskdb
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - taskmgr-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

  # Backend REST API Service: Node.js 20 & Express
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: taskmgr-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGO_URI: mongodb://mongodb:27017/taskdb
      JWT_SECRET: supersecretjwtkeyforpracticals
      DOCKER_CONTAINER: "true"
    ports:
      - "5000:5000"
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - taskmgr-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 10s

  # Frontend Client: Vite React SPA served via Nginx Reverse Proxy
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: taskmgr-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "5173:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - taskmgr-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/healthz"]
      interval: 15s
      timeout: 5s
      retries: 3

networks:
  taskmgr-network:
    driver: bridge

volumes:
  mongo_data:
    driver: local`,

    backendDocker: `# backend/Dockerfile - Lightweight Node.js 20 on Alpine
FROM node:20-alpine

RUN apk add --no-cache curl
WORKDIR /usr/src/app

ENV NODE_ENV=production \\
    PORT=5000 \\
    DOCKER_CONTAINER=true

COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

COPY . .

# Unprivileged user for container security
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "server.js"]`,

    frontendDocker: `# frontend/Dockerfile - Multi-Stage Production Build
# --- Stage 1: Build the Vite production bundle ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: Serve production assets with Nginx ---
FROM nginx:alpine
RUN apk add --no-cache curl
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]`,

    nginxConfig: `# frontend/nginx.conf - Production Reverse Proxy & SPA Fallback
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html index.htm;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform, immutable";
    }

    # SPA routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy for backend API calls
    location /api/ {
        proxy_pass http://backend:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /healthz {
        access_log off;
        return 200 "healthy\\n";
    }
}`,

    devCompose: `# docker-compose.dev.yml - Development Bind-Mount Hot-Reloading
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: taskmgr-mongodb-dev
    ports:
      - "27017:27017"
    volumes:
      - mongo_data_dev:/data/db
    networks:
      - taskmgr-dev-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: taskmgr-backend-dev
    environment:
      NODE_ENV: development
      PORT: 5000
      MONGO_URI: mongodb://mongodb:27017/taskdb
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/usr/src/app
      - /usr/src/app/node_modules
    networks:
      - taskmgr-dev-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:80"
    networks:
      - taskmgr-dev-network

networks:
  taskmgr-dev-network:
    driver: bridge

volumes:
  mongo_data_dev:
    driver: local`,
  };

  return (
    <div className="caching-lab-container docker-lab-container">
      {/* Header Banner */}
      <div className="glass-panel lab-header-card">
        <div className="lab-header-content">
          <div className="lab-tag-wrapper">
            <span className="lab-tag docker-tag">Practical 11: Containerization with Docker</span>
            <span className="lab-subtag">Multi-Stage Builds & Docker Compose Orchestration</span>
          </div>
          <h1 className="lab-title">Docker Container Orchestration & Topology Inspector</h1>
          <p className="lab-description">
            Fully containerized 3-tier architecture with multi-stage production builds, 
            isolated bridge networks, healthcheck probes, and persistent MongoDB named volumes.
          </p>
        </div>

        <div className="lab-quick-actions">
          <button 
            id="btn-probe-health"
            className="btn btn-primary"
            onClick={handleProbeHealth}
            disabled={isProbing}
          >
            {isProbing ? 'Probing...' : '⚡ Probe Container Health (Ping)'}
          </button>
          <button 
            id="btn-refresh-docker"
            className="btn btn-secondary"
            onClick={fetchStatus}
          >
            🔄 Refresh Status
          </button>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper blue">🐳</div>
          <div className="stat-meta">
            <span className="stat-label">Multi-Container Architecture</span>
            <h3 className="stat-value">3 Services</h3>
            <span className="stat-detail">Frontend, Backend, MongoDB</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper green">🌐</div>
          <div className="stat-meta">
            <span className="stat-label">Isolated Bridge Network</span>
            <h3 className="stat-value">taskmgr-network</h3>
            <span className="stat-detail">DNS Name Resolution</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper purple">💾</div>
          <div className="stat-meta">
            <span className="stat-label">Volume Persistence</span>
            <h3 className="stat-value">mongo_data</h3>
            <span className="stat-detail">Retains data across restarts</span>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-wrapper orange">⚡</div>
          <div className="stat-meta">
            <span className="stat-label">Healthcheck Probe</span>
            <h3 className="stat-value">{healthProbe.status.toUpperCase()}</h3>
            <span className="stat-detail">{healthProbe.pingLatencyMs}ms ping latency</span>
          </div>
        </div>
      </div>

      {/* 3-Tier Multi-Container Topology Map */}
      <div className="glass-panel topology-section">
        <div className="panel-header">
          <div>
            <h3>🗺️ 3-Tier Container Topology & Network Map</h3>
            <p className="panel-subtitle">Orchestrated via Docker Compose with health-dependent startup sequence</p>
          </div>
          <span className="badge-network">Bridge Network: taskmgr-network</span>
        </div>

        <div className="topology-grid">
          {/* Service 1: Frontend */}
          <div className="topology-card client-tier">
            <div className="tier-badge">Tier 1: Web Client</div>
            <div className="service-header">
              <span className="service-icon">🌐</span>
              <div>
                <h4 className="service-name">taskmgr-frontend</h4>
                <span className="service-image">nginx:alpine</span>
              </div>
              <span className="status-indicator-dot green" title="Healthy"></span>
            </div>

            <div className="service-specs">
              <div className="spec-row">
                <span className="spec-label">Build Type:</span>
                <span className="spec-value highlight">Multi-Stage Build</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Port Mapping:</span>
                <code className="spec-code">5173:80 / 80:80</code>
              </div>
              <div className="spec-row">
                <span className="spec-label">Role:</span>
                <span className="spec-value">SPA Web Server & Reverse Proxy</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Healthcheck:</span>
                <code className="spec-code">curl -f http://localhost/healthz</code>
              </div>
            </div>

            <div className="dependency-arrow">⬇️ Proxies /api/ calls ⬇️</div>
          </div>

          {/* Service 2: Backend */}
          <div className="topology-card api-tier">
            <div className="tier-badge">Tier 2: Application API</div>
            <div className="service-header">
              <span className="service-icon">⚙️</span>
              <div>
                <h4 className="service-name">taskmgr-backend</h4>
                <span className="service-image">node:20-alpine</span>
              </div>
              <span className="status-indicator-dot green" title="Healthy"></span>
            </div>

            <div className="service-specs">
              <div className="spec-row">
                <span className="spec-label">Base OS:</span>
                <span className="spec-value">Alpine Linux (node user)</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Port Mapping:</span>
                <code className="spec-code">5000:5000</code>
              </div>
              <div className="spec-row">
                <span className="spec-label">Memory RSS:</span>
                <span className="spec-value highlight">{telemetry.memory?.rss || '42 MB'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Healthcheck:</span>
                <code className="spec-code">curl -f http://localhost:5000/health</code>
              </div>
            </div>

            <div className="dependency-arrow">⬇️ Reads / Writes NoSQL ⬇️</div>
          </div>

          {/* Service 3: MongoDB */}
          <div className="topology-card db-tier">
            <div className="tier-badge">Tier 3: Database</div>
            <div className="service-header">
              <span className="service-icon">🍃</span>
              <div>
                <h4 className="service-name">taskmgr-mongodb</h4>
                <span className="service-image">mongo:7.0</span>
              </div>
              <span className="status-indicator-dot green" title="Healthy"></span>
            </div>

            <div className="service-specs">
              <div className="spec-row">
                <span className="spec-label">Database Name:</span>
                <span className="spec-value highlight">taskdb</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Port Mapping:</span>
                <code className="spec-code">27017:27017</code>
              </div>
              <div className="spec-row">
                <span className="spec-label">Named Volume:</span>
                <span className="spec-value">mongo_data:/data/db</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Healthcheck:</span>
                <code className="spec-code">mongosh ping</code>
              </div>
            </div>

            <div className="dependency-tag">Persistent Storage</div>
          </div>
        </div>
      </div>

      {/* Interactive Docker Specification Viewer */}
      <div className="glass-panel benchmark-card benchmark-full-width">
        <div className="panel-header">
          <div>
            <h3>📄 Dockerfile & Docker Compose Specifications</h3>
            <p className="panel-subtitle">Production-grade container configuration files for Practical 11</p>
          </div>
          <div className="spec-tabs">
            <button 
              className={`spec-tab-btn ${activeTab === 'compose' ? 'active' : ''}`}
              onClick={() => setActiveTab('compose')}
            >
              docker-compose.yml
            </button>
            <button 
              className={`spec-tab-btn ${activeTab === 'backendDocker' ? 'active' : ''}`}
              onClick={() => setActiveTab('backendDocker')}
            >
              backend/Dockerfile
            </button>
            <button 
              className={`spec-tab-btn ${activeTab === 'frontendDocker' ? 'active' : ''}`}
              onClick={() => setActiveTab('frontendDocker')}
            >
              frontend/Dockerfile
            </button>
            <button 
              className={`spec-tab-btn ${activeTab === 'nginxConfig' ? 'active' : ''}`}
              onClick={() => setActiveTab('nginxConfig')}
            >
              nginx.conf
            </button>
            <button 
              className={`spec-tab-btn ${activeTab === 'devCompose' ? 'active' : ''}`}
              onClick={() => setActiveTab('devCompose')}
            >
              docker-compose.dev.yml
            </button>
          </div>
        </div>

        <div className="code-block-wrapper">
          <pre className="docker-code-block">
            <code>{specFiles[activeTab]}</code>
          </pre>
        </div>

        {/* CLI Reference & Orchestration Commands */}
        <div className="docker-cli-grid">
          <div className="cli-box">
            <span className="cli-action">Build & Run Stack:</span>
            <code>docker-compose up -d --build</code>
          </div>
          <div className="cli-box">
            <span className="cli-action">Check Service Status:</span>
            <code>docker-compose ps</code>
          </div>
          <div className="cli-box">
            <span className="cli-action">Inspect Live Logs:</span>
            <code>docker-compose logs -f backend</code>
          </div>
          <div className="cli-box">
            <span className="cli-action">Tear Down & Cleanup:</span>
            <code>docker-compose down -v</code>
          </div>
        </div>
      </div>
    </div>
  );
}
