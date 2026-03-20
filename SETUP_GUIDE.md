# Complete Setup Guide

This guide walks you through setting up the entire Global Exams platform from scratch.

## Prerequisites

Before starting, ensure you have:
- Node.js 14+ installed (https://nodejs.org)
- Python 3.8+ installed (https://python.org)
- MongoDB installed locally or access to MongoDB Atlas (https://cloud.mongodb.com)
- A code editor (VS Code recommended)
- Git for version control

## Step 1: MongoDB Setup

### Option A: Local MongoDB

1. **Download and Install**
   - Visit https://docs.mongodb.com/manual/installation/
   - Choose your OS and follow installation steps

2. **Start MongoDB**
   - Windows: `mongod` in command prompt
   - macOS: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

3. **Verify**
   ```bash
   mongo
   > db.version()
   # Should show your MongoDB version
   ```

### Option B: MongoDB Atlas (Cloud)

1. Create account at https://cloud.mongodb.com
2. Create a project and cluster
3. Get connection string: `mongodb+srv://username:password@host/dbname`
4. Use this in `.env` files

## Step 2: Backend Setup

### Install Node.js Dependencies

```bash
# Navigate to backend
cd "Global Exams and Learning Portal\backend"

# Install npm packages
npm install
```

### Configure Environment

```bash
# Copy example env file
copy .env.example .env

# Edit .env file with your settings
```

Edit `backend/.env`:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/global-exams
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY=7d
PYTHON_SERVICE_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Test Backend

```bash
npm run dev
```

You should see:
```
Server running on port 5000
Environment: development
Database: mongodb://localhost:27017/global-exams
```

Visit `http://localhost:5000/api/health` - should return OK.

## Step 3: Python Service Setup

### Create Virtual Environment

```bash
cd "Global Exams and Learning Portal\python-evaluator"

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate  # Windows

# On macOS/Linux:
# source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- FastAPI
- Pydantic
- SymPy (math evaluation)
- scikit-learn (semantic similarity)
- NLTK (keyword matching)

### Download NLTK Data

```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

### Configure Environment

```bash
copy .env.example .env
```

Edit `python-evaluator/.env`:
```
PORT=8000
HOST=0.0.0.0
DEBUG=True
LOG_LEVEL=INFO
```

### Test Python Service

```bash
python main.py
```

You should see:
```
Starting Python Evaluation Service on 0.0.0.0:8000
```

Visit `http://localhost:8000/api/health` - should return healthy status.

## Step 4: Frontend Setup

No build step needed for MVP! Just open the HTML file.

### Option A: Direct File Access
```bash
# Navigate to frontend
cd "Global Exams and Learning Portal\frontend\public"

# Open index.html in your browser
start index.html  # Windows
open index.html   # macOS
```

### Option B: Local Server (Recommended)

**Using Python:**
```bash
cd "Global Exams and Learning Portal\frontend\public"
python -m http.server 8080
# Visit http://localhost:8080
```

**Using Node.js http-server:**
```bash
npm install -g http-server
http-server "Global Exams and Learning Portal\frontend\public" -p 8080
```

## Step 5: Verify All Services

Open three terminals:

**Terminal 1 - Backend:**
```bash
cd "Global Exams and Learning Portal\backend"
npm run dev
```

**Terminal 2 - Python Service:**
```bash
cd "Global Exams and Learning Portal\python-evaluator"
venv\Scripts\activate
python main.py
```

**Terminal 3 - Frontend:**
```bash
cd "Global Exams and Learning Portal\frontend\public"
python -m http.server 8080
```

## Step 6: Test the Application

1. Open browser to `http://localhost:8080`
2. Click "Sign Up" to register
3. Enter:
   - Email: `teacher@example.com`
   - Password: `password123`
   - Name: `John Teacher`
   - Role: `teacher` (select from dropdown)
4. Click "Sign Up"
5. You should be logged in

### Test as Teacher:

1. Create an exam:
   - Title: "Sample Physics Exam"
   - Duration: 30 minutes
   - Total Marks: 100

2. Create a question:
   - Text: "What is photosynthesis?"
   - Type: "short_answer"
   - Marks: 10
   - Keywords: ["photosynthesis", "light", "glucose"]
   - Method: "keyword"

### Test as Student:

1. Log out and create a student account
2. Start the exam
3. Answer the question
4. Submit exam
5. View results

## Troubleshooting

### "Cannot find module" errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
Solutions:
- Check MongoDB is running: `mongod` in another terminal
- Check connection string in `.env`
- Try MongoDB Atlas cloud instead

### Python Module Not Found
```
ModuleNotFoundError: No module named 'fastapi'
```
Solutions:
- Activate virtual environment: `venv\Scripts\activate`
- Reinstall: `pip install -r requirements.txt`

### CORS Error in Browser Console
```
Access to XMLHttpRequest blocked by CORS policy
```
Solutions:
- Ensure backend is running on port 5000
- Check `ALLOWED_ORIGINS` in backend `.env`
- Restart backend after changes

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
Solutions:
- Change PORT in `.env`
- Or kill process: `npx kill-port 5000` (npm required)

## Database Seed Data

Optional: Load sample data for testing

```bash
cd backend
npm run seed
```

(Seed script coming soon)

## API Testing with Postman

1. Import the collection from `backend/postman-collection.json`
2. Set variables:
   - `{{base_url}}` = `http://localhost:5000`
   - `{{token}}` = JWT token from login response
3. Run requests

## Next Steps

1. **Review the codebase:**
   - Backend: `backend/src/`
   - Python: `python-evaluator/app/`
   - Frontend: `frontend/src/`

2. **Customize:**
   - Modify exam questions in `questionController.js`
   - Adjust evaluation logic in `python-evaluator/app/evaluators/`
   - Style the frontend in `frontend/src/css/style.css`

3. **Deploy:**
   - Follow Docker setup guide (coming soon)
   - Deploy to AWS/GCP/Azure

## Common Commands

### Backend
```bash
npm start          # Production
npm run dev        # Development
npm test           # Run tests
```

### Python
```bash
python main.py     # Start
python -m pytest   # Run tests
```

### Database
```bash
mongosh                      # Connect to local MongoDB
use global-exams            # Switch to database
db.users.find()            # List all users
db.exams.find()            # List all exams
db.dropDatabase()           # Delete database (careful!)
```

## Getting Help

1. Check `README.md` for architecture overview
2. Review code comments for implementation details
3. Check `API_DESIGN.md` for endpoint documentation
4. Enable debug logging:
   - Backend: `LOG_LEVEL=debug`
   - Python: `DEBUG=True`

## Success Checklist

- [ ] Node.js installed and verified
- [ ] Python 3.8+ installed and verified
- [ ] MongoDB running and accessible
- [ ] Backend dependencies installed
- [ ] Python dependencies installed
- [ ] All services running on correct ports
- [ ] Frontend accessible in browser
- [ ] Can register and login as student
- [ ] Can register and login as teacher
- [ ] Can create exam (teacher)
- [ ] Can add question (teacher)
- [ ] Can start exam (student)
- [ ] Can submit answer (student)
- [ ] Can submit exam (student)
- [ ] Can view results (student)

Congratulations! You have successfully set up Global Exams!

---

For more detailed architecture information, see `ARCHITECTURE.md`
For API documentation, see `API_DESIGN.md`
