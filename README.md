# Global Exams - AI-Powered Online Learning and Examination Platform

A comprehensive online learning and examination platform with automatic answer evaluation using AI.

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **AI/Evaluation**: Python + FastAPI
- **Authentication**: JWT

## Project Structure

```
Global Exams and Learning Portal/
├── backend/              (Node.js server)
├── python-evaluator/    (AI evaluation service)
└── frontend/            (Web application)
```

## Quick Start

### Prerequisites

- Node.js 14+
- Python 3.8+
- MongoDB (local or cloud)
- npm or yarn

### 1. Backend Setup (Node.js)

```bash
cd backend

# Copy environment file
copy .env.example .env

# Edit .env with your configuration
# Set MONGODB_URI to your MongoDB connection string

# Install dependencies
npm install

# Start development server
npm run dev

# Server runs on http://localhost:5000
```

### 2. Python Evaluation Service

```bash
cd python-evaluator

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows

# Or on macOS/Linux:
# source venv/bin/activate

# Copy environment file
copy .env.example .env

# Install dependencies
pip install -r requirements.txt

# Start service
python main.py

# Service runs on http://localhost:8000
```

### 3. Frontend Setup

The frontend is a static HTML application. Simply open `frontend/public/index.html` in a browser or serve it:

```bash
# Using Python
cd frontend/public
python -m http.server 8080

# Or using Node.js http-server
npm install -g http-server
http-server frontend/public -p 8080
```

Access the application at `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Exams
- `GET /api/exams` - Get all exams
- `GET /api/exams/:examId` - Get exam details
- `POST /api/exams` - Create exam (teacher)
- `PUT /api/exams/:examId` - Update exam (teacher)
- `POST /api/exams/:examId/publish` - Publish exam (teacher)
- `DELETE /api/exams/:examId` - Delete exam (teacher)

### Questions
- `POST /api/exams/:examId/questions` - Add question (teacher)
- `GET /api/exams/:examId/questions` - Get exam questions
- `PUT /api/exams/:examId/questions/:questionId` - Update question (teacher)
- `DELETE /api/exams/:examId/questions/:questionId` - Delete question (teacher)

### Answers
- `POST /api/answers/:examId/:questionId` - Submit answer (student)
- `GET /api/answers/:examId/my-answers` - Get student answers
- `POST /api/answers/:examId/submit` - Submit exam (student)

### Results
- `GET /api/results/:examId` - Get student result
- `POST /api/results/:examId/initialize` - Initialize result for grading
- `PUT /api/results/:examId` - Update result with scores

### Python Evaluation API
- `POST /api/evaluate` - Evaluate single answer
- `POST /api/evaluate/batch` - Batch evaluate answers
- `GET /api/health` - Health check

## Database Schema

### Collections

**Users**
```javascript
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String,
  role: String (student|teacher|admin),
  name: String,
  department: String,
  enrolledExams: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

**Exams**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  createdBy: ObjectId (User),
  duration: Number (minutes),
  totalMarks: Number,
  questionIds: [ObjectId],
  enrolledStudents: [ObjectId],
  status: String (draft|active|closed),
  startTime: Date,
  endTime: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Questions**
```javascript
{
  _id: ObjectId,
  examId: ObjectId,
  text: String,
  type: String (mcq|short_answer|long_answer|math),
  marks: Number,
  options: [{ text: String, isCorrect: Boolean }],
  rubric: {
    keywords: [String],
    answerKey: String,
    method: String (exact|keyword|semantic|math)
  },
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Answers**
```javascript
{
  _id: ObjectId,
  examId: ObjectId,
  questionId: ObjectId,
  studentId: ObjectId,
  answerText: String,
  submittedAt: Date,
  isLocked: Boolean,
  updatedAt: Date
}
```

**Results**
```javascript
{
  _id: ObjectId,
  examId: ObjectId,
  studentId: ObjectId,
  answers: [{
    questionId: ObjectId,
    studentAnswer: String,
    score: Number,
    feedback: String,
    evaluationMethod: String
  }],
  totalScore: Number,
  totalMarks: Number,
  percentage: Number,
  status: String (pending|evaluated|reviewed),
  gradedAt: Date,
  submittedAt: Date
}
```

## Evaluation Methods

The Python service supports multiple evaluation methods:

1. **Exact Match** - String comparison (MCQ, exact answers)
   ```python
   method = "exact"
   ```

2. **Keyword Matching** - Check for required keywords
   ```python
   method = "keyword"
   rubric = {
     "keywords": ["photosynthesis", "light energy", "glucose"]
   }
   ```

3. **Semantic Similarity** - Using TF-IDF similarity
   ```python
   method = "semantic"
   rubric = {
     "answerKey": "Complete answer text"
   }
   ```

4. **Math Evaluation** - Using SymPy for mathematical expressions
   ```python
   method = "math"
   rubric = {
     "answerKey": "2x + 3 = 7"
   }
   ```

## Usage Examples

### Register and Login

```javascript
// In frontend
await api.register('student@example.com', 'password', 'John', 'student');
await api.login('student@example.com', 'password');
```

### Create Exam (Teacher)

```javascript
const exam = await api.createExam({
  title: 'Physics Midterm',
  description: 'Midterm exam for Physics 101',
  duration: 120,
  totalMarks: 100,
  instructions: 'Read all questions carefully'
});
```

### Add Question

```javascript
const question = await api.addQuestion(examId, {
  text: 'What is photosynthesis?',
  type: 'short_answer',
  marks: 10,
  rubric: {
    keywords: ['photosynthesis', 'light', 'glucose'],
    method: 'keyword'
  }
});
```

### Submit Answer (Student)

```javascript
await api.submitAnswer(examId, questionId, 'Student answer text');
```

### Evaluate Answers

Answers are automatically evaluated when exam is submitted. Results are calculated using the configured rubric and evaluation method.

## Development Workflow

### Adding a New Question Type

1. Update `Question` model in `backend/src/models/Question.js`
2. Add handler in `backend/src/controllers/questionController.js`
3. Update front-end in `frontend/src/js/app.js`
4. Test via API

### Adding a New Evaluator

1. Create new evaluator class in `python-evaluator/app/evaluators/`
2. Extend `BaseEvaluator`
3. Add to router in `python-evaluator/app/api/endpoints/evaluate.py`
4. Test with sample data

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Python Tests
```bash
cd python-evaluator
pytest tests/
```

## Deployment

### Docker (Coming Soon)
```bash
docker-compose up
```

### Cloud Deployment
Instructions for AWS/Azure/GCP coming soon.

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`

### Python Service Not Found
- Ensure Python service is running on port 8000
- Check `PYTHON_SERVICE_URL` in Node backend `.env`

### Frontend Can't Connect Backend
- Check CORS headers
- Verify backend is running on port 5000

## Future Enhancements

- [ ] React frontend with better UX
- [ ] Real-time collaboration features
- [ ] LLM-based grading (GPT-3.5, Claude)
- [ ] MathQuill for math input
- [ ] Rich text editor (Quill, Draft.js)
- [ ] Advanced analytics and reporting
- [ ] Email notifications
- [ ] Proctoring features
- [ ] Mobile application
- [ ] Docker & Kubernetes deployment

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

MIT

## Support

For questions or issues, please create an issue on GitHub or contact the development team.

---

**Version**: 1.0.0 MVP  
**Last Updated**: March 2026
