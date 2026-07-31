from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class TestCaseSchema(BaseModel):
    """Schema for programming test cases"""
    input: Optional[str] = ""
    expectedOutput: Optional[str] = ""
    weight: Optional[float] = 1.0

class RubricSchema(BaseModel):
    """Schema for evaluation rubric"""
    keywords: Optional[List[str]] = []
    answerKey: Optional[str] = None
    method: Optional[str] = 'keyword'
    sampleAnswers: Optional[List[str]] = []
    testCases: Optional[List[TestCaseSchema]] = []
    questionText: Optional[str] = ""

class EvaluationRequestSchema(BaseModel):
    """Schema for evaluation request"""
    answer: str
    question: Optional[str] = ""
    question_type: Optional[str] = "short_answer"   # mcq, short_answer, long_answer, math, programming
    subject: Optional[str] = "general"              # coding, math, english, science, general
    rubric: RubricSchema

class BatchEvaluationRequestSchema(BaseModel):
    """Schema for batch evaluation request"""
    answers: List[EvaluationRequestSchema]
    examId: Optional[str] = None

class EvaluationResponseSchema(BaseModel):
    """Schema for evaluation response"""
    score: float
    maxScore: Optional[float] = 1.0
    feedback: str
    evaluationMethod: str
    confidence: float
    modelUsed: Optional[str] = "none"
    subjectEvaluated: Optional[str] = "general"
    testResults: Optional[List[Dict[str, Any]]] = []

class HealthCheckResponseSchema(BaseModel):
    """Schema for health check response"""
    status: str
    service: str = "Python Evaluation Engine"
    version: str = "2.0.0"
    ollamaAvailable: Optional[bool] = False
    availableModels: Optional[List[str]] = []
