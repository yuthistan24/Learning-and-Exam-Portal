# Architecture Documentation

## System Overview

Global Exams is a distributed, microservices-style architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                               │
│  (Browser - HTML5/CSS3/JavaScript)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              NODE.JS / EXPRESS (Port 5000)                      │
│         SYSTEM LAYER - Orchestration & Data Persistence        │
│                                                                 │
│  ├─ Auth Layer (JWT, Login/Register)                           │
│  ├─ Exam Management (CRUD exams, questions)                    │
│  ├─ Answer Collection (Store responses)                        │
│  ├─ Routing & Middleware                                       │
│  └─ Database Interface (Mongoose ODM)                          │
│                                                                 │
└────────┬────────────────────────────────────────────┬──────────┘
         │                                            │
    HTTP/REST                                    MongoDB Driver
         │                                            │
         ▼                                            ▼
┌──────────────────────┐                    ┌────────────────────┐
│ PYTHON/FASTAPI      │                    │  MONGODB DATABASE  │
│ (Port 8000)         │                    │                    │
│                     │                    │ Collections:       │
│ Evaluation Engine   │                    │ ├─ users          │
│                     │                    │ ├─ exams          │
│ ├─ Exact Match      │                    │ ├─ questions      │
│ ├─ Keyword Match    │                    │ ├─ answers        │
│ ├─ Semantic Sim     │                    │ └─ results        │
│ └─ Math Eval        │                    │                    │
│                     │                    │ Indexes:          │
│ + Feedback Gen      │                    │ ├─ by_exam        │
│ + Confidence Score  │                    │ ├─ by_student     │
│                     │                    │ └─ by_teacher     │
└──────────────────────┘                    └────────────────────┘
```

## Architectural Principles

### 1. Separation of Concerns
- **Frontend**: User interface and client-side logic
- **Backend**: Business logic, authentication, routing, data management
- **AI Layer**: Specialized evaluation algorithms

### 2. Stateless Services
- Services don't maintain session state
- JWT handles authentication
- Scales horizontally easily

### 3. Microservices Communication
- HTTP REST APIs for inter-service comms
- Node.js → Python via single endpoint `/api/evaluate`
- Timeout handling for robustness

### 4. Database Design
- Document-based model (MongoDB) for flexibility
- Proper indexing for query performance
- Relationships via ObjectId references

---

## Component Architecture

### Frontend Layer

**File Structure**:
```
frontend/
├── public/
│   └── index.html        (Single Page Application)
└── src/
    ├── css/
    │   └── style.css     (Responsive styling)
    └── js/
        ├── api.js        (API client wrapper)
        └── app.js        (Application logic)
```

**Key Components**:
1. **Auth Module** - Registration/login/logout
2. **Exam Browser** - List and navigate exams
3. **Exam Interface** - Display questions, collect answers, show timer
4. **Results Viewer** - Display scores and feedback

**Technology**:
- Vanilla JavaScript (no build step needed)
- Fetch API for HTTP requests
- LocalStorage for token persistence
- DOM manipulation for UI updates

### Backend Layer (Node.js)

**Architecture Pattern**: Model-View-Controller (MVC) adapted for API

**File Structure**:
```
backend/
├── src/
│   ├── app.js              (Express setup, middleware stack)
│   ├── config/             (Configuration files)
│   │   └── database.js     (MongoDB connection)
│   ├── middleware/         (Express middleware)
│   │   ├── auth.js         (JWT verification, role-based access)
│   │   └── errorHandler.js (Global error handling)
│   ├── models/             (Mongoose schemas)
│   │   ├── User.js
│   │   ├── Exam.js
│   │   ├── Question.js
│   │   ├── Answer.js
│   │   └── Result.js
│   ├── controllers/        (Request handlers)
│   │   ├── authController.js
│   │   ├── examController.js
│   │   ├── questionController.js
│   │   ├── answerController.js
│   │   └── resultController.js
│   ├── routes/             (Express routes)
│   │   ├── auth.js
│   │   ├── exams.js
│   │   ├── questions.js
│   │   ├── answers.js
│   │   └── results.js
│   ├── services/           (Business logic)
│   │   ├── authService.js  (JWT token generation)
│   │   └── pythonClient.js (Python API client)
│   └── utils/              (Utility functions)
│       ├── logger.js
│       └── validators.js
└── server.js               (Entry point)
```

**Request Flow**:
```
Client Request
    ↓
Express App → CORS & Body Parser
    ↓
Router (URL matching)
    ↓
Authentication Middleware (JWT verify)
    ↓
Authorization Middleware (role check)
    ↓
Controller (business logic)
    ↓
Model (database interaction)
    ↓
Response formatting
    ↓
Error Handler (if error)
    ↓
JSON Response
```

**Key Features**:
- JWT-based stateless authentication
- Role-based access control (RBAC)
- Comprehensive error handling
- CORS enabled for frontend
- Mongoose ODM for type safety

### Python Evaluation Layer

**Architecture Pattern**: Strategy Pattern for interchangeable evaluators

**File Structure**:
```
python-evaluator/
├── app/
│   ├── main.py                          (FastAPI app)
│   ├── config.py                        (Environment config)
│   ├── api/
│   │   ├── schemas.py                   (Pydantic models)
│   │   └── endpoints/
│   │       └── evaluate.py              (Route handlers)
│   ├── evaluators/                      (Strategy implementations)
│   │   ├── base.py                      (Abstract base class)
│   │   ├── exact.py                     (Exact match strategy)
│   │   ├── keyword.py                   (Keyword matching strategy)
│   │   ├── semantic.py                  (TF-IDF similarity)
│   │   └── math.py                      (SymPy expressions)
│   ├── feedback/
│   │   └── generator.py                 (Dynamic feedback)
│   └── utils/
│       └── logger.py
├── requirements.txt
└── main.py                              (Entry point)
```

**Request Flow**:
```
Evaluation Request (from Node.js)
    ↓
FastAPI Router
    ↓
Pydantic Validation (request schema)
    ↓
Choose Evaluator (by method)
    ↓
Evaluator.evaluate(answer, rubric)
    ↓
Calculate Score (0.0 - 1.0)
    ↓
Generate Feedback (dynamic)
    ↓
Calculate Confidence
    ↓
Pydantic Response Schema
    ↓
JSON Response to Node.js
```

**Evaluator Strategy Pattern**:
```
BaseEvaluator (abstract)
    ├── ExactMatchEvaluator (string comparison)
    ├── KeywordEvaluator (NLTK tokenization)
    ├── SemanticEvaluator (TF-IDF cosine similarity)
    └── MathEvaluator (SymPy symbolic math)
```

Each evaluator implements the same interface:
```python
def evaluate(answer: str, rubric: dict) -> dict:
    return {
        'score': float,          # 0.0 to 1.0
        'feedback': str,
        'evaluation_method': str,
        'confidence': float      # 0.0 to 1.0
    }
```

**Technology**:
- FastAPI for high performance REST API
- Pydantic for request/response validation
- SymPy for mathematical expression evaluation
- scikit-learn (TF-IDF) for semantic similarity
- NLTK for natural language processing

---

## Data Flow: Complete Exam Lifecycle

### 1. Exam Creation (Teacher)

```
Frontend (Create Exam Form)
    ↓ POST /api/exams
Node.js (examController.createExam)
    ↓
Validate input
    ↓
Create Exam document (status: 'draft')
    ↓ INSERT
MongoDB (exams collection)
    ↓
Return exam ID
    ↓
Frontend (Show success, allow adding questions)
```

### 2. Question Addition (Teacher)

```
Frontend (Question Form)
    ↓ POST /api/exams/:examId/questions
Node.js (questionController.addQuestion)
    ↓
Validate exam exists and user is creator
    ↓
Create Question document
    ↓ INSERT
MongoDB (questions collection)
    ↓
Update exam.questionIds array
    ↓ UPDATE exams
Return question ID
    ↓
Frontend (Add more questions or publish)
```

### 3. Exam Publication (Teacher)

```
Frontend (Publish Button)
    ↓ POST /api/exams/:examId/publish
Node.js (examController.publishExam)
    ↓
Verify questions exist (at least 1)
    ↓
Update exam.status = 'active'
    ↓ UPDATE exams
MongoDB
    ↓
Frontend (Show exam is live)
```

### 4. Exam Enrollment (Teacher)

```
Frontend (Enroll Students)
    ↓ POST /api/exams/:examId/enroll
Node.js (examController.enrollStudents)
    ↓
Add studentIds to exam.enrolledStudents
    ↓ UPDATE exams
MongoDB
    ↓
Frontend (Show enrolled list)
```

### 5. Student Takes Exam

```
Frontend (Get Exam)
    ↓ GET /api/exams/:examId
Node.js (examController.getExamById)
    ↓
Fetch exam + populate questions
    ↓ FIND + LOOKUP
MongoDB
    ↓
Return questions to frontend
    ↓
Frontend (Display questions, start timer)

[For each answer submitted]
Frontend (Answer typed)
    ↓ POST /api/answers/:examId/:questionId
Node.js (answerController.submitAnswer)
    ↓
Create/Update Answer document
    ↓ INSERT/UPDATE
MongoDB
    ↓
Frontend (Save success, next question)
```

### 6. Exam Submission (Student)

```
Frontend (Submit Button)
    ↓ POST /api/answers/:examId/submit
Node.js (answerController.submitExam)
    ↓
Lock all answers (isLocked = true)
    ↓ UPDATE answers
MongoDB
    ↓
Initialize Result (POST /api/results/:examId/initialize)
    ↓
Create Result document (status: 'pending')
    ↓ INSERT
MongoDB (results collection)
    ↓
For each answer:
    Get question rubric
    Call Python evaluation service
        ↓ POST localhost:8000/api/evaluate
    Python Service evaluates answer
        ↓
    Returns score, feedback, confidence
    ↓
Update Result with scores
    ↓ UPDATE results
MongoDB
    ↓
Frontend (Redirect to results page)
```

### 7. View Results (Student)

```
Frontend (Results Page)
    ↓ GET /api/results/:examId
Node.js (resultController.getStudentResult)
    ↓
Fetch Result with populated references
    ↓ FIND + LOOKUP
MongoDB
    ↓
Return formatted result
    ↓
Frontend (Display scores, feedback)
```

### 8. Teacher View Analytics

```
Frontend (Analytics Page)
    ↓ GET /api/results/exam/:examId
Node.js (resultController.getExamResults)
    ↓
Verify teacher authorization
    ↓
Fetch all results for exam
    ↓ FIND
MongoDB
    ↓
Return results list
    ↓
Frontend (Show class analytics)
```

---

## Database Design Decisions

### Collection Structure

**Users Collection**
- Primary use: Authentication, profile management
- Indexes: email (unique), role
- Relationships: 1 user → many exams (enrolledExams array)

**Exams Collection**
- Primary use: Exam metadata, question references
- Indexes: createdBy, status, enrolledStudents
- Relationships: 1 exam → many questions (questionIds array)
                1 exam → many students (enrolledStudents array)

**Questions Collection**
- Primary use: Question text, type, rubric
- Indexes: examId, order
- Relationships: many questions → 1 exam
- Denormalization: rubric embedded (small data)

**Answers Collection**
- Primary use: Store raw student responses
- Indexes: examId + studentId (composite), questionId + studentId
- Relationships: many answers → 1 exam, 1 question, 1 student
- No denormalization needed

**Results Collection**
- Primary use: Graded results with feedback
- Indexes: examId + studentId (composite), studentId
- Relationships: many results → 1 exam, 1 student
- Denormalization: Answer details embedded (for reporting)

### Indexing Strategy

```javascript
// Fast exam lookups by teacher
examSchema.index({ createdBy: 1, status: 1 });

// Fast student exam enrollment
examSchema.index({ enrolledStudents: 1 });

// Fast question ordering
questionSchema.index({ examId: 1, order: 1 });

// Fast answer retrieval
answerSchema.index({ examId: 1, studentId: 1 });
answerSchema.index({ questionId: 1, studentId: 1 });

// Fast result queries
resultSchema.index({ examId: 1, studentId: 1 });
resultSchema.index({ studentId: 1, gradedAt: -1 });
```

---

## Evaluation Algorithm Pipeline

### Step 1: Route Request
```
Method selection in route handler
  ↓
Determine evaluator based on question type + rubric.method
```

### Step 2: Validate Input
```
Pydantic schema validates:
  - answer is non-empty string
  - rubric has required fields
  - question_type is valid
```

### Step 3: Select Evaluator

```python
evaluators = {
    'exact': ExactMatchEvaluator(),
    'keyword': KeywordEvaluator(threshold=0.6),
    'semantic': SemanticEvaluator(),
    'math': MathEvaluator()
}
evaluator = evaluators.get(rubric['method'])
```

### Step 4: Execute Evaluation

**Exact Match**:
```
student_answer.lower() == answer_key.lower()
  ↓
Score: 1.0 or 0.0
Confidence: 1.0 (certainty of exact comparison)
```

**Keyword Matching**:
```
For each keyword:
  Check if keyword appears in answer
  ↓
matched_count / total_keywords = score
Confidence based on matches and answer length
```

**Semantic Similarity**:
```
Vectorize answer and answerKey using TF-IDF
  ↓
cosine_similarity(vec1, vec2)
  ↓
Score: 0.0 to 1.0
Confidence: based on answer length + similarity strength
```

**Math Evaluation**:
```
Parse both expressions with SymPy
  ↓
Simplify and compare
  ↓
If equivalent: Score 1.0
If not: Try numerical evaluation at random points
  ↓
Score: 1.0 or 0.0
Confidence: 0.95+ (math is deterministic)
```

### Step 5: Generate Feedback

```
if score >= 0.9:
    feedback = "Excellent work! Your answer is comprehensive..."
elif score >= 0.7:
    feedback = "Good answer! You covered the main points..."
elif score >= 0.5:
    feedback = "Fair attempt. Some key points missing..."
else:
    feedback = "Your answer needs improvement..."
```

### Step 6: Return Response

```json
{
  "score": 0.85,
  "feedback": "Good answer...",
  "evaluationMethod": "keyword",
  "confidence": 0.92
}
```

---

## Security Considerations

### Authentication
- JWT tokens with 7-day expiry
- Passwords hashed with bcrypt (10 salt rounds)
- Tokens verified on protected routes

### Authorization
- Role-based access control (RBAC)
- Teachers can only edit/view their own exams
- Students can only view enrolled exams
- Results scoped to user

### Data Validation
- Pydantic schemas on all inputs (Python)
- Joi would be used in production (Node.js)
- SQL injection impossible (using ODM)
- XSS mitigated (no direct HTML insertion)

### CORS
- Whitelist specific origins
- Credentials allowed for same-site requests

---

## Performance Considerations

### Database Optimization
- Indexes on frequently queried fields
- Composite indexes for multi-field queries
- Denormalization of rubrics to avoid lookups

### API Optimization
- Pagination for list endpoints (page, limit)
- Selective field population (Mongoose .select())
- Caching of Python model (loaded once)

### Frontend Optimization
- Single HTML file (minimal requests)
- CSS bundled in style.css
- JavaScript bundled in app.js
- No external dependencies (no npm install)

### Python Service
- TF-IDF vectorizer reused across requests
- SymPy expressions compiled efficiently
- No external API calls (local evaluation)

---

## Scalability Roadmap

### Phase 1 (Current): Single Instance
- Node.js: one process
- Python: one process
- MongoDB: local or small cloud

### Phase 2: Horizontal Scaling
- Node.js: multiple instances behind load balancer
- Python: multiple instances for parallel evaluation
- Redis: session cache and distributed locking
- MongoDB: replica set for HA

### Phase 3: Global Scale
- Docker containers
- Kubernetes orchestration
- Distributed Python workers
- CDN for frontend static assets
- Database sharding by exam/student

---

## Monitoring & Logging

### Metrics to Track
- API response times
- Error rates by endpoint
- Evaluation service latency
- Database query performance
- Student exam completion rates

### Logging Strategy
- Structured JSON logs (production)
- Log levels: debug, info, warn, error
- Separate logs for each service
- Centralized logging (ELK, DataDog, etc.)

---

## Testing Strategy

### Unit Tests
- Controller logic isolation
- Evaluator algorithm correctness
- Token generation and verification

### Integration Tests
- Auth flow (register → login → protected route)
- Exam CRUD (create → add questions → publish)
- Answer submission and evaluation

### End-to-End Tests
- Complete exam flow (student perspective)
- Complete teaching flow (teacher perspective)
- Result visualization and analytics

---

## Future Architecture Improvements

1. **API Gateway**: Centralize routing and auth
2. **Message Queue**: Async evaluation with Celery/RabbitMQ
3. **Caching Layer**: Redis for session and result cache
4. **LLM Integration**: OpenAI/Claude for advanced grading
5. **Search Engine**: Elasticsearch for question bank search
6. **Analytics Engine**: Kafka + aggregation for insights
7. **Real-time Collaboration**: WebSockets for live feedback
8. **Proctoring Module**: Video + behavior analysis

---

## Deployment Architecture

### Development
```
localhost:3000 ←→ localhost:5000 ←→ localhost:27017
(Frontend)      (Node.js)         (MongoDB)
                   ↕
            localhost:8000
            (Python Service)
```

### Production (Single Server)
```
nginx (reverse proxy, static files)
 ├─→ :5000 Node.js (PM2 cluster)
 ├─→ :8000 Python (Gunicorn workers)
 └─→ MongoDB (replica set)
```

### Production (Distributed)
```
CloudFlare CDN
    ↓
Load Balancer (AWS ALB)
    ├─→ Node.js Cluster (multiple EC2)
    ├─→ Python Cluster (multiple EC2)
    └─→ MongoDB Atlas (managed)
    
Redis Cluster
Elasticsearch Cluster
CloudWatch Monitoring
```

---

This architecture is designed to be:
- **Scalable**: Easy to add more servers
- **Maintainable**: Clear separation of concerns
- **Reliable**: Error handling at each layer
- **Extensible**: Pluggable evaluators and APIs
