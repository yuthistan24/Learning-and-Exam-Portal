# API Design Documentation

## Overview

The Global Exams platform uses a RESTful API architecture with two main services:
1. **Node.js/Express** - System & orchestration layer (Port 5000)
2. **Python/FastAPI** - AI evaluation engine (Port 8000)

## Authentication

All protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

## Base URLs

- **Backend API**: `http://localhost:5000/api`
- **Python Evaluator**: `http://localhost:8000/api`

---

## Authentication Endpoints

### Register User

**Endpoint**: `POST /auth/register`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "student"  // or "teacher"
}
```

**Response** (201):
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

### Login

**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response** (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

### Get Current User

**Endpoint**: `GET /auth/me`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "user": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "student",
    "department": null
  }
}
```

### Logout

**Endpoint**: `POST /auth/logout`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

---

## Exam Endpoints

### Create Exam (Teacher Only)

**Endpoint**: `POST /exams`

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "title": "Physics Midterm",
  "description": "Midterm examination for Physics 101",
  "duration": 120,
  "totalMarks": 100,
  "instructions": "Answer all questions. No external aids allowed.",
  "shuffleQuestions": false,
  "showFeedback": true
}
```

**Response** (201):
```json
{
  "message": "Exam created successfully",
  "exam": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Physics Midterm",
    "duration": 120,
    "totalMarks": 100,
    "status": "draft",
    "createdBy": "507f1f77bcf86cd799439012",
    "createdAt": "2026-03-20T10:00:00Z"
  }
}
```

### Get All Exams

**Endpoint**: `GET /exams?page=1&limit=10&status=active`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page` (int, default: 1) - Page number for pagination
- `limit` (int, default: 10) - Items per page
- `status` (string) - Filter by status (draft, active, closed)

**Response** (200):
```json
{
  "exams": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Physics Midterm",
      "description": "Midterm examination",
      "status": "active",
      "duration": 120,
      "totalMarks": 100,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Dr. Smith",
        "email": "smith@example.com"
      }
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

### Get Exam by ID

**Endpoint**: `GET /exams/:examId`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Physics Midterm",
  "description": "Midterm examination",
  "duration": 120,
  "totalMarks": 100,
  "status": "active",
  "instructions": "Answer all questions...",
  "questionIds": ["507f1f77bcf86cd799439020", "507f1f77bcf86cd799439021"],
  "enrolledStudents": ["507f1f77bcf86cd799439030"],
  "startTime": "2026-03-20T10:00:00Z",
  "endTime": null,
  "createdBy": "507f1f77bcf86cd799439012",
  "createdAt": "2026-03-20T10:00:00Z",
  "updatedAt": "2026-03-20T10:00:00Z"
}
```

### Update Exam (Teacher Only, Draft Only)

**Endpoint**: `PUT /exams/:examId`

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "title": "Physics Midterm (Revised)",
  "duration": 150,
  "totalMarks": 120
}
```

**Response** (200):
```json
{
  "message": "Exam updated successfully",
  "exam": { /* updated exam data */ }
}
```

### Publish Exam (Teacher Only)

**Endpoint**: `POST /exams/:examId/publish`

**Headers**: `Authorization: Bearer <token>`

**Request**: `{}` (empty body)

**Response** (200):
```json
{
  "message": "Exam published successfully",
  "exam": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "active",
    "startTime": "2026-03-20T10:30:00Z"
  }
}
```

**Note**: Exam must have at least one question to be published.

### Delete Exam (Teacher Only)

**Endpoint**: `DELETE /exams/:examId`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "message": "Exam deleted successfully"
}
```

### Enroll Students (Teacher Only)

**Endpoint**: `POST /exams/:examId/enroll`

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "studentIds": ["507f1f77bcf86cd799439030", "507f1f77bcf86cd799439031"]
}
```

**Response** (200):
```json
{
  "message": "2 students enrolled",
  "exam": { /* exam data */ }
}
```

### Get Exam Analytics (Teacher Only)

**Endpoint**: `GET /exams/:examId/analytics`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "examId": "507f1f77bcf86cd799439011",
  "title": "Physics Midterm",
  "totalStudents": 5,
  "avgScore": 72.5,
  "passRate": 80,
  "questionWisePerformance": []
}
```

---

## Question Endpoints

### Add Question (Teacher Only)

**Endpoint**: `POST /exams/:examId/questions`

**Headers**: `Authorization: Bearer <token>`

**Request for MCQ**:
```json
{
  "text": "What is the SI unit of force?",
  "type": "mcq",
  "marks": 5,
  "options": [
    { "text": "Newton", "isCorrect": true },
    { "text": "Joule", "isCorrect": false },
    { "text": "Pascal", "isCorrect": false },
    { "text": "Watt", "isCorrect": false }
  ],
  "rubric": {
    "method": "exact"
  }
}
```

**Request for Short Answer**:
```json
{
  "text": "Explain photosynthesis in 2-3 sentences.",
  "type": "short_answer",
  "marks": 10,
  "rubric": {
    "keywords": ["photosynthesis", "light", "glucose", "chlorophyll"],
    "answerKey": "Photosynthesis is a process where plants use light energy to convert carbon dioxide and water into glucose and oxygen.",
    "method": "keyword"
  }
}
```

**Response** (201):
```json
{
  "message": "Question added successfully",
  "question": {
    "_id": "507f1f77bcf86cd799439020",
    "examId": "507f1f77bcf86cd799439011",
    "text": "What is the SI unit of force?",
    "type": "mcq",
    "marks": 5,
    "order": 0,
    "createdAt": "2026-03-20T10:00:00Z"
  }
}
```

### Get Questions by Exam

**Endpoint**: `GET /exams/:examId/questions`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439020",
    "examId": "507f1f77bcf86cd799439011",
    "text": "What is the SI unit of force?",
    "type": "mcq",
    "marks": 5,
    "options": [ /* option details */ ],
    "order": 0
  },
  {
    "_id": "507f1f77bcf86cd799439021",
    "examId": "507f1f77bcf86cd799439011",
    "text": "Explain photosynthesis...",
    "type": "short_answer",
    "marks": 10,
    "order": 1
  }
]
```

### Update Question (Teacher Only)

**Endpoint**: `PUT /exams/questions/:questionId`

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "text": "Updated question text",
  "marks": 15,
  "rubric": {
    "keywords": ["updated", "keywords"]
  }
}
```

**Response** (200):
```json
{
  "message": "Question updated successfully",
  "question": { /* updated question data */ }
}
```

### Delete Question (Teacher Only)

**Endpoint**: `DELETE /exams/questions/:questionId`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "message": "Question deleted successfully"
}
```

---

## Answer Endpoints

### Submit Answer (Student)

**Endpoint**: `POST /answers/:examId/:questionId`

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "answerText": "Newton is the SI unit of force."
}
```

**Response** (200):
```json
{
  "message": "Answer saved successfully",
  "answer": {
    "_id": "507f1f77bcf86cd799439050",
    "examId": "507f1f77bcf86cd799439011",
    "questionId": "507f1f77bcf86cd799439020",
    "studentId": "507f1f77bcf86cd799439030",
    "answerText": "Newton is the SI unit of force.",
    "submittedAt": "2026-03-20T10:30:00Z",
    "isLocked": false
  }
}
```

### Get Student Answers (Student)

**Endpoint**: `GET /answers/:examId/my-answers`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439050",
    "questionId": "507f1f77bcf86cd799439020",
    "answerText": "Newton",
    "submittedAt": "2026-03-20T10:30:00Z"
  },
  {
    "_id": "507f1f77bcf86cd799439051",
    "questionId": "507f1f77bcf86cd799439021",
    "answerText": "Photosynthesis is...",
    "submittedAt": "2026-03-20T10:32:00Z"
  }
]
```

### Submit Exam (Student)

**Endpoint**: `POST /answers/:examId/submit`

**Headers**: `Authorization: Bearer <token>`

**Request**: `{}` (empty body)

**Response** (200):
```json
{
  "message": "Exam submitted successfully",
  "totalAnswers": 2,
  "submittedAt": "2026-03-20T10:45:00Z"
}
```

**Note**: This locks all answers and initiates evaluation.

---

## Result Endpoints

### Get Student Result

**Endpoint**: `GET /results/:examId`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "_id": "507f1f77bcf86cd799439060",
  "examId": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Physics Midterm",
    "totalMarks": 100
  },
  "studentId": "507f1f77bcf86cd799439030",
  "totalScore": 85,
  "totalMarks": 100,
  "percentage": 85.0,
  "status": "evaluated",
  "answers": [
    {
      "questionId": {
        "_id": "507f1f77bcf86cd799439020",
        "text": "What is the SI unit of force?"
      },
      "studentAnswer": "Newton",
      "score": 5,
      "maxScore": 5,
      "feedback": "Correct!",
      "evaluationMethod": "exact",
      "confidence": 1.0
    },
    {
      "questionId": {
        "_id": "507f1f77bcf86cd799439021",
        "text": "Explain photosynthesis..."
      },
      "studentAnswer": "Photosynthesis is a process...",
      "score": 8,
      "maxScore": 10,
      "feedback": "Good! Missing some details.",
      "evaluationMethod": "keyword",
      "confidence": 0.85
    }
  ],
  "submittedAt": "2026-03-20T10:45:00Z",
  "gradedAt": "2026-03-20T10:46:00Z"
}
```

### Initialize Result (Student)

**Endpoint**: `POST /results/:examId/initialize`

**Headers**: `Authorization: Bearer <token>`

**Request**: `{}` (empty body)

**Response** (200):
```json
{
  "message": "Result initialized",
  "result": { /* result data */ }
}
```

**Note**: Called automatically after exam submission.

### Update Result with Scores

**Endpoint**: `PUT /results/:examId`

**Headers**: `Authorization: Bearer <token>`

**Request**:
```json
{
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439020",
      "score": 5,
      "feedback": "Correct!",
      "evaluationMethod": "exact",
      "confidence": 1.0
    },
    {
      "questionId": "507f1f77bcf86cd799439021",
      "score": 8,
      "feedback": "Good answer!",
      "evaluationMethod": "keyword",
      "confidence": 0.85
    }
  ]
}
```

**Response** (200):
```json
{
  "message": "Result updated",
  "result": { /* updated result data */ }
}
```

### Get All Student Results

**Endpoint**: `GET /results/my-results`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439060",
    "examId": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Physics Midterm",
      "totalMarks": 100
    },
    "totalScore": 85,
    "totalMarks": 100,
    "percentage": 85.0,
    "status": "evaluated",
    "gradedAt": "2026-03-20T10:46:00Z"
  }
]
```

### Get Exam Results (Teacher Only)

**Endpoint**: `GET /results/exam/:examId`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
[
  {
    "_id": "507f1f77bcf86cd799439060",
    "studentId": {
      "_id": "507f1f77bcf86cd799439030",
      "name": "Alice Johnson",
      "email": "alice@example.com"
    },
    "totalScore": 85,
    "totalMarks": 100,
    "percentage": 85.0,
    "status": "evaluated",
    "submittedAt": "2026-03-20T10:45:00Z"
  },
  {
    "_id": "507f1f77bcf86cd799439061",
    "studentId": {
      "_id": "507f1f77bcf86cd799439031",
      "name": "Bob Smith",
      "email": "bob@example.com"
    },
    "totalScore": 72,
    "totalMarks": 100,
    "percentage": 72.0,
    "status": "evaluated",
    "submittedAt": "2026-03-20T10:50:00Z"
  }
]
```

---

## Python Evaluation Endpoints

### Evaluate Single Answer

**Endpoint**: `POST /api/evaluate`

**Base URL**: `http://localhost:8000`

**Request**:
```json
{
  "answer": "Newton is the SI unit of force.",
  "question": "What is the SI unit of force?",
  "question_type": "short_answer",
  "rubric": {
    "keywords": ["Newton", "force", "SI"],
    "answerKey": "Newton is the SI unit of force",
    "method": "keyword"
  }
}
```

**Response** (200):
```json
{
  "score": 1.0,
  "maxScore": 1.0,
  "feedback": "Excellent! All key points covered.",
  "evaluationMethod": "keyword",
  "confidence": 0.95
}
```

### Batch Evaluate Answers

**Endpoint**: `POST /api/evaluate/batch`

**Request**:
```json
{
  "answers": [
    {
      "answer": "Newton",
      "question": "What is SI unit of force?",
      "question_type": "mcq",
      "rubric": {
        "answerKey": "Newton",
        "method": "exact"
      }
    },
    {
      "answer": "Photosynthesis uses light...",
      "question": "Explain photosynthesis",
      "question_type": "short_answer",
      "rubric": {
        "keywords": ["photosynthesis", "light"],
        "method": "keyword"
      }
    }
  ],
  "examId": "507f1f77bcf86cd799439011"
}
```

**Response** (200):
```json
{
  "examId": "507f1f77bcf86cd799439011",
  "results": [
    {
      "score": 1.0,
      "feedback": "Correct!",
      "evaluationMethod": "exact",
      "confidence": 1.0
    },
    {
      "score": 0.8,
      "feedback": "Good!",
      "evaluationMethod": "keyword",
      "confidence": 0.9
    }
  ],
  "totalEvaluated": 2
}
```

### Health Check

**Endpoint**: `GET /api/health`

**Response** (200):
```json
{
  "status": "healthy",
  "service": "Python Evaluation Engine",
  "version": "1.0.0"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "message": "Email, password, and name are required",
    "statusCode": 400
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "message": "Invalid or expired token",
    "statusCode": 401
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "message": "Not authorized to update this exam",
    "statusCode": 403
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "message": "Exam not found",
    "statusCode": 404
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "message": "Internal server error",
    "statusCode": 500,
    "stack": "..." // Only in development
  }
}
```

---

## Rate Limiting (Future)

Currently not implemented. Add rate limiting middleware for production.

## Versioning

API v1.0 - No versioning in URLs. Future versions will use `/api/v2/...`

---

For code examples and frontend integration, see the frontend documentation.
