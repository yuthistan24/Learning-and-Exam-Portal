# Docker & Deployment Guide

## Docker Setup (Optional for MVP, but recommended)

### Prerequisites
- Docker installed (https://docker.com)
- Docker Compose installed

### Create Docker Compose File

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:6.0
    container_name: global-exams-db
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: global-exams
    volumes:
      - mongodb_data:/data/db
    networks:
      - app-network

  # Node.js Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: global-exams-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://mongodb:27017/global-exams
      JWT_SECRET: your-secret-key-here
      PYTHON_SERVICE_URL: http://python-service:8000
      ALLOWED_ORIGINS: http://localhost:3000,http://localhost:80
    depends_on:
      - mongodb
    networks:
      - app-network
    volumes:
      - ./backend/src:/app/src

  # Python Evaluator Service
  python-service:
    build:
      context: ./python-evaluator
      dockerfile: Dockerfile
    container_name: global-exams-evaluator
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      PORT: 8000
      DEBUG: "False"
      LOG_LEVEL: INFO
    networks:
      - app-network
    volumes:
      - ./python-evaluator/app:/app/app

  # Nginx Reverse Proxy & Frontend Server
  nginx:
    image: nginx:alpine
    container_name: global-exams-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend/public:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      # SSL certificates (for HTTPS):
      # - /etc/letsencrypt/live/example.com:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - python-service
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongodb_data:
    driver: local
```

### Create Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY server.js .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "server.js"]
```

### Create Python Dockerfile

Create `python-evaluator/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"

# Copy source code
COPY app ./app
COPY main.py .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Start application
CMD ["python", "main.py"]
```

### Create Nginx Configuration

Create `nginx.conf`:

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/true + font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Frontend
    server {
        listen 80;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        # Static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1d;
            add_header Cache-Control "public, immutable";
        }

        # API proxy
        location /api/ {
            proxy_pass http://backend:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }
    }

    # HTTPS Configuration (uncomment after SSL setup)
    # server {
    #     listen 443 ssl http2;
    #     server_name example.com www.example.com;
    #
    #     ssl_certificate /etc/nginx/ssl/fullchain.pem;
    #     ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    #     ssl_session_timeout 1d;
    #     ssl_session_cache shared:SSL:50m;
    #
    #     # ... same config as port 80 ...
    # }
    #
    # # HTTP redirect to HTTPS
    # server {
    #     listen 80;
    #     server_name example.com www.example.com;
    #     return 301 https://$server_name$request_uri;
    # }
}
```

### Run with Docker Compose

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (caution: deletes data)
docker-compose down -v

# Rebuild images
docker-compose up --build
```

---

## Deployment Options

### Option 1: Local Development
Using Docker Compose as shown above.

### Option 2: Single Server (AWS EC2, DigitalOcean, etc.)

**Setup Instructions**:

1. **Launch Ubuntu Server 22.04 LTS**
   - At least t3.medium (2vCPU, 4GB RAM)
   - Security group opens ports: 22, 80, 443

2. **Install Dependencies**:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

3. **Clone Repository**:
```bash
git clone <repo-url>
cd global-exams
```

4. **Configure Environment**:
```bash
# Create .env files
cd backend
cp .env.example .env
nano .env  # Edit with your settings

cd ../python-evaluator
cp .env.example .env
```

5. **Deploy with Docker Compose**:
```bash
docker-compose up -d

# Check service logs
docker-compose logs -f backend
docker-compose logs -f python-service
```

6. **Setup SSL Certificate**:
```bash
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx.conf with certificate paths
sudo systemctl restart nginx
```

### Option 3: Kubernetes (EKS, GKE, AKS)

**Create `k8s/deployment.yaml`**:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: global-exams

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: global-exams
data:
  NODE_ENV: production
  MONGODB_URI: mongodb://mongodb:27017/global-exams

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: global-exams
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/global-exams-backend:latest
        ports:
        - containerPort: 5000
        envFrom:
        - configMapRef:
            name: backend-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: global-exams
spec:
  selector:
    app: backend
  ports:
  - port: 5000
    targetPort: 5000
  type: LoadBalancer
```

**Deploy with Helm** (recommended for production):

```bash
helm create global-exams
helm install global-exams ./global-exams -n global-exams
```

### Option 4: Serverless (AWS Lambda + API Gateway)

Not recommended for this architecture due to long-running Python evaluations. Better suited for:
- Stateless API endpoints
- Quick evaluation services
- Event-driven workflows

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Build Docker images
      run: |
        docker build -t registry.example.com/backend:${{ github.sha }} ./backend
        docker build -t registry.example.com/python:${{ github.sha }} ./python-evaluator

    - name: Push to registry
      run: |
        docker login -u ${{ secrets.REGISTRY_USER }} -p ${{ secrets.REGISTRY_PASS }}
        docker push registry.example.com/backend:${{ github.sha }}
        docker push registry.example.com/python:${{ github.sha }}

    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd ~/global-exams
          docker-compose down
          docker-compose pull
          docker-compose up -d
```

---

## Monitoring & Health Checks

### Health Check Endpoints

**Backend**: `GET /api/health`
```json
{ "status": "OK" }
```

**Python**: `GET /api/health`
```json
{ "status": "healthy", "service": "Python Evaluation Engine" }
```

### Monitoring with Docker

```bash
# Check container status
docker ps

# View logs
docker logs global-exams-backend
docker logs global-exams-evaluator

# Check resource usage
docker stats

# Inspect container
docker inspect global-exams-backend
```

### Production Monitoring Stack

Recommended tools:
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **ELK Stack**: Logging
- **Sentry**: Error tracking
- **Datadog**: APM

---

## Backup & Recovery

### Database Backups

```bash
# Backup MongoDB
docker exec global-exams-db mongodump --out /backup

# Restore MongoDB
docker exec global-exams-db mongorestore /backup
```

### Automated Backups (Cron)

```bash
> backup.sh
#!/bin/bash
BACKUP_DIR=/backups/$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker exec global-exams-db mongodump --out $BACKUP_DIR

# Keep only last 30 days
find /backups -type d -mtime +30 -exec rm -rf {} +
```

Schedule with crontab:
```bash
0 2 * * * /home/user/backup.sh  # Daily at 2 AM
```

---

## Performance Tuning

### MongoDB
```javascript
// Create indexes
db.exams.createIndex({ createdBy: 1, status: 1 });
db.questions.createIndex({ examId: 1, order: 1 });
db.results.createIndex({ examId: 1, studentId: 1 });

// Monitor slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().limit(5).sort({ ts: -1 }).pretty()
```

### Node.js
```javascript
// Use clustering
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  // Fork workers
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }
}
```

### Python
```bash
# Use Gunicorn with workers
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app
```

---

## Scaling Checklist

- [ ] Database replica set configured
- [ ] Connection pooling enabled
- [ ] Caching layer (Redis) deployed
- [ ] Load balancer configured
- [ ] StatN backends behind load balancer
- [ ] Python evaluator scaled horizontally
- [ ] CDN enabled for static assets
- [ ] Monitoring and alerting configured
- [ ] Auto-scaling rules defined
- [ ] Disaster recovery plan tested

---

## Troubleshooting

### Container won't start
```bash
docker logs <container-name>
docker inspect <container-name>
```

### Cannot connect to database
```bash
# Check MongoDB is running
docker exec global-exams-db mongosh

# Check network
docker network inspect app-network
```

### Port already in use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Out of disk space
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
docker system df
```

---

This deployment guide covers development to production scenarios.
For questions or issues, refer to your deployment platform's documentation.
