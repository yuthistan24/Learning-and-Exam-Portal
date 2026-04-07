# Global Exams & Learning Portal - Complete Setup Guide

## System Overview

This is a **fully functional multi-role exam and learning platform** with the following features:

### Architecture
- **Frontend**: HTML5 with modern CSS (Nginx)
- **Backend**: Node.js Express API
- **Database**: MongoDB
- **Code Evaluator**: Python service
- **Orchestration**: Docker Compose

### Roles & Features

#### 👤 Student
- View available exams
- Take exams with proctored environment & timer
- View personal exam results & scores
- Track progress with grade system (A-F)
- Learning portal dashboard

#### 👨‍🏫 Teacher
- Create and manage exams
- Publish exams to students
- View exam statistics
- Monitor student results
- Dashboard with exam management

#### ⚙️ Administrator
- Full system management
- User management (create, view, delete)
- User role assignment
- System statistics & analytics
- Dashboard overview
- MongoDB database access (via Mongo Express on port 8081)

## Prerequisites

- **Docker** & **Docker Compose** (latest versions)
- **Git** (for version control)
- CPU: 2+ cores
- RAM: 4GB+
- Disk: 10GB+

## Quick Start (Docker)

### 1. Clone and Navigate
```bash
cd /path/to/Global-Exams-and-Learning-Portal
```

### 2. Build Services
```bash
docker-compose build
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Access the Platform
- **Frontend**: http://localhost:80 (or http://localhost)
- **Backend API**: http://localhost:5000
- **Database UI**: http://localhost:8081 (admin/admin123)
- **Python Evaluator**: http://localhost:8000

### 5. Stop Services
```bash
docker-compose down
```

### 6. View Logs
```bash
docker-compose logs -f backend     # Backend logs
docker-compose logs -f nginx       # Frontend logs
docker-compose logs -f mongodb     # Database logs
```

## Service Architecture

```
┌─────────────────────────────────────────┐
│         User Browser (Port 80)          │
│  Frontend: HTML, CSS, JavaScript        │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┴────────────┐
    ▼                         ▼
┌─────────────┐        ┌──────────────┐
│   Nginx     │        │ API Backend  │
│  (Port 80)  │        │ (Port 5000)  │
└─────────────┘        └──────┬───────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              ┌──────────┐        ┌──────────────┐
              │ MongoDB  │        │ Python       │
              │(Port   17│        │ Evaluator    │
              │ 27017)   │        │ (Port 8000)  │
              └──────────┘        └──────────────┘
```

## File Structure

```
Global-Exams-and-Learning-Portal/
├── frontend/                    # Frontend (Nginx served)
│   ├── login.html              # Login page
│   ├── signup.html             # Registration page
│   ├── dashboard.html          # Main dashboard (role-based)
│   ├── exam.html               # Exam taking interface
│   ├── results.html            # Results & performance
│   ├── public/                 # Static assets
│   └── src/
│       ├── css/style.css       # Global styles
│       ├── js/
│       │   ├── api.js          # API client
│       │   └── app.js          # App logic
│       └── assets/             # Images, fonts, etc.
│
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── app.js             # Express app
│   │   ├── server.js          # Entry point
│   │   ├── config/database.js # MongoDB config
│   │   ├── models/            # Data models
│   │   │   ├── User.js
│   │   │   ├── Exam.js
│   │   │   ├── Question.js
│   │   │   ├── Answer.js
│   │   │   └── Result.js
│   │   ├── controllers/       # Business logic
│   │   │   ├── authController.js
│   │   │   ├── examController.js
│   │   │   ├── questionController.js
│   │   │   ├── answerController.js
│   │   │   ├── resultController.js
│   │   │   └── adminController.js
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth, errors, etc.
│   │   ├── services/         # Util services
│   │   └── utils/            # Helpers, logger
│   ├── Dockerfile            # Docker build config
│   ├── package.json          # Dependencies
│   └── server.js            # Start script
│
├── python-evaluator/         # Python code evaluation service
│   ├── app/                 # Python Flask app
│   ├── main.py             # Entry point
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile          # Docker build config
│   └── tests/              # Test files
│
├── docker-compose.yml       # Multi-container orchestration
├── nginx.conf               # Nginx configuration
└── SETUP_GUIDE.md          # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Exams (Students)
- `GET /api/exams` - Get available exams
- `GET /api/exams/:id` - Get exam details
- `GET /api/exams/:id/questions` - Get exam questions

### Exams (Teachers)
- `POST /api/exams` - Create new exam
- `POST /api/exams/:id/questions` - Add question
- `POST /api/exams/:id/publish` - Publish exam

### Answers
- `POST /api/answers/:examId/:questionId` - Submit answer
- `POST /api/answers/:examId/submit` - Submit entire exam

### Results
- `GET /api/results/:examId` - Get exam result
- `POST /api/results/:examId/initialize` - Initialize result
- `GET /api/results/exam/:examId` - Get all results for an exam

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## Database Collections

### Users
```javascript
{
  _id: ObjectId,
  email: String,
  passwordHash: String (hashed with bcrypt),
  name: String,
  role: "student" | "teacher" | "admin",
  department: String,
  enrolledExams: [ObjectId],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Exams
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  creatorId: ObjectId (references User),
  duration: Number (minutes),
  totalMarks: Number,
  status: "draft" | "active" | "archived",
  createdAt: Date,
  updatedAt: Date
}
```

### Results
```javascript
{
  _id: ObjectId,
  userId: ObjectId (references User),
  examId: ObjectId (references Exam),
  score: Number,
  totalMarks: Number,
  questionsAttempted: Number,
  submittedAt: Date,
  feedbackText: String
}
```

## User Workflows

### Student Workflow
1. Sign up → Select "Student" role
2. Login to dashboard
3. Browse available exams
4. Click "Start Exam"
5. Answer questions within time limit
6. Submit exam
7. View results immediately
8. Access all results from "My Results" section

### Teacher Workflow
1. Sign up → Select "Teacher" role
2. Login to dashboard
3. Click "+ Create Exam"
4. Fill exam details (title, description, duration, marks)
5. Click "Publish" to make available to students
6. View student results and statistics

### Admin Workflow
1. Sign up → Select "Admin" role (or manually assign via DB)
2. Login to admin dashboard
3. Navigate "Overview" tab for system statistics
4. Navigate "Users" tab to manage users
5. Create, view, delete users
6. Assign roles (student, teacher, admin)
7. Monitor system health

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/global-exams
JWT_SECRET=scalable-secret-key-123
PYTHON_SERVICE_URL=http://python-service:8000
ALLOWED_ORIGINS=http://localhost:80
PORT=5000
```

### Python Service (.env)
```
PORT=8000
DEBUG=False
LOG_LEVEL=INFO
```

## Authentication & Security

- **Password Hashing**: bcryptjs (10 salt rounds)
- **JWT Tokens**: Signed tokens stored in localStorage
- **Token Expiry**: Configure in auth service
- **CORS**: Configured for allowed origins
- **Database**: MongoDB Atlas or local instance
- **Default Roles**: student, teacher, admin

## Styling & UI

- **Framework**: Custom CSS with CSS Variables
- **Dark Theme**: Modern dark UI with accent colors
- **Responsive**: Mobile-first responsive design
- **Animations**: Smooth transitions and hover effects
- **Typography**: Inter (body) and Outfit (headings)

## Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose logs backend
docker-compose logs mongodb

# Rebuild images
docker-compose build --no-cache

# Reset everything
docker-compose down -v
docker-compose up -d
```

### Can't Connect to Database
```bash
# Check MongoDB is running
docker-compose logs mongodb

# Verify DNS resolution
docker-compose exec backend nslookup mongodb

# Test connection manually
docker-compose exec backend curl http://mongodb:27017
```

### Login Issues
- Verify user exists in database
- Check JWT_SECRET is configured
- Verify cookies/localStorage enabled in browser
- Check admin/users list for user account

### Port Already in Use
```bash
# Check what's using port 80
lsof -i :80 (Linux/Mac)
netstat -ano | findstr :80 (Windows)

# Change in docker-compose.yml
```

## Performance Optimization

- Nginx caching for static files
- MongoDB indexing on email and userId
- Health checks on services
- Connection pooling
- Gzipped responses
- Code splitting on frontend

## Backup & Recovery

### Backup Database
```bash
docker-compose exec mongodb mongodump --archive=backup.gz --gzip --uri="mongodb://localhost:27017/global-exams"
```

### Restore Database
```bash
docker-compose exec mongodb mongorestore --archive=backup.gz --gzip --uri="mongodb://localhost:27017"
```

## Production Deployment

1. Use environment variables for sensitive data
2. Enable SSL/TLS certificates
3. Set up database backups
4. Configure logging aggregation
5. Monitor system metrics
6. Use reverse proxy (nginx/HAProxy)
7. Set resource limits in docker-compose
8. Enable database replication

## Support & Development

- Enable debug logs: `LOG_LEVEL=DEBUG`
- Check service health: http://localhost:5000/api/health
- Database UI: http://localhost:8081
- Backend console: `docker-compose logs -f backend`

## License

MIT

## Created: April 6, 2026
