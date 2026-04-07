# Deployment Instructions for Global Exams & Learning Portal

## 🐳 Docker Deployment (Recommended)

### Quick Start
```bash
# 1. Navigate to project root
cd Global-Exams-and-Learning-Portal

# 2. Build all services
docker-compose build

# 3. Start services
docker-compose up -d

# 4. Access from browser
# Frontend: http://localhost
# Backend API: http://localhost:5000
# Database UI: http://localhost:8081 (admin/admin123)
```

### Services Running
- **Nginx** (Port 80): Frontend server
- **Express Backend** (Port 5000): API server
- **MongoDB** (Port 27017): Database
- **Python Service** (Port 8000): Code evaluator
- **Mongo Express** (Port 8081): Database UI

## 🗂️ Key Files for Deployment

- `docker-compose.yml` - Container orchestration
- `nginx.conf` - Web server configuration
- `backend/Dockerfile` - Backend container image
- `python-evaluator/Dockerfile` - Python service container
- `.env` files - Environment configuration

## 👥 User Accounts

### Create Test Accounts
1. Go to http://localhost
2. Click "Get Started"
3. Sign up as Student or Teacher
4. Login with credentials

### Admin Access
- Use the signup page to create an admin account
- Or use MongoDB UI (http://localhost:8081) to update user roles

## 📊 Monitoring

### View Logs
```bash
docker-compose logs -f backend       # Backend logs
docker-compose logs -f nginx         # Frontend logs
docker-compose logs -f mongodb       # Database logs
```

### Check Service Status
```bash
docker-compose ps
```

## 🔧 Troubleshooting

### Port Already in Use
Update `docker-compose.yml` to use different ports

### Database Issues
```bash
# Check MongoDB
docker-compose logs mongodb

# Reset database
docker-compose down -v
docker-compose up -d
```

### Clear Cache
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```
