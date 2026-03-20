from fastapi import APIRouter, HTTPException
from app.api.schemas import (
    EvaluationRequestSchema,
    BatchEvaluationRequestSchema,
    EvaluationResponseSchema,
    HealthCheckResponseSchema
)
from app.evaluators import (
    ExactMatchEvaluator,
    KeywordEvaluator,
    SemanticEvaluator,
    MathEvaluator
)
from app.utils.logger import logger

router = APIRouter(prefix="/api", tags=["evaluation"])

# Initialize evaluators
exact_evaluator = ExactMatchEvaluator()
keyword_evaluator = KeywordEvaluator(threshold=0.6)
semantic_evaluator = SemanticEvaluator()
math_evaluator = MathEvaluator()

def get_evaluator(method: str):
    """Get appropriate evaluator for method"""
    evaluators = {
        'exact': exact_evaluator,
        'keyword': keyword_evaluator,
        'semantic': semantic_evaluator,
        'math': math_evaluator
    }
    return evaluators.get(method, keyword_evaluator)

@router.post("/evaluate", response_model=EvaluationResponseSchema)
async def evaluate_answer(request: EvaluationRequestSchema):
    """
    Evaluate a single answer based on rubric
    """
    try:
        logger.info(f"Evaluating answer using method: {request.rubric.method}")
        
        # Choose evaluator based on rubric method
        evaluator = get_evaluator(request.rubric.method)
        
        # Evaluate
        result = evaluator.evaluate(request.answer, request.rubric.dict())
        
        return EvaluationResponseSchema(
            score=result['score'],
            feedback=result['feedback'],
            evaluationMethod=result['evaluation_method'],
            confidence=result['confidence']
        )
    
    except Exception as e:
        logger.error(f"Evaluation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation failed: {str(e)}"
        )

@router.post("/evaluate/batch")
async def batch_evaluate(request: BatchEvaluationRequestSchema):
    """
    Batch evaluate multiple answers
    """
    try:
        logger.info(f"Batch evaluating {len(request.answers)} answers for exam {request.examId}")
        
        results = []
        for answer_request in request.answers:
            evaluator = get_evaluator(answer_request.rubric.method)
            result = evaluator.evaluate(answer_request.answer, answer_request.rubric.dict())
            
            results.append(EvaluationResponseSchema(
                score=result['score'],
                feedback=result['feedback'],
                evaluationMethod=result['evaluation_method'],
                confidence=result['confidence']
            ))
        
        return {
            'examId': request.examId,
            'results': results,
            'totalEvaluated': len(results)
        }
    
    except Exception as e:
        logger.error(f"Batch evaluation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch evaluation failed: {str(e)}"
        )

@router.get("/health", response_model=HealthCheckResponseSchema)
async def health_check():
    """
    Health check endpoint
    """
    return HealthCheckResponseSchema(status="healthy")
