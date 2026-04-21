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
from app.evaluators.programming import ProgrammingEvaluator
from app.validators.cross_validator import CrossValidator
from app.utils.logger import logger

router = APIRouter(prefix="/api", tags=["evaluation"])

# Initialize evaluators
exact_evaluator = ExactMatchEvaluator()
keyword_evaluator = KeywordEvaluator(threshold=0.6)
semantic_evaluator = SemanticEvaluator()
math_evaluator = MathEvaluator()
programming_evaluator = ProgrammingEvaluator()

# Initialize validator
validator = CrossValidator()

def get_evaluator(method: str):
    """Get appropriate evaluator for method"""
    evaluators = {
        'exact': exact_evaluator,
        'keyword': keyword_evaluator,
        'semantic': semantic_evaluator,
        'math': math_evaluator,
        'programming': programming_evaluator
    }
    return evaluators.get(method, keyword_evaluator)

@router.post("/evaluate", response_model=EvaluationResponseSchema)
async def evaluate_answer(request: EvaluationRequestSchema):
    """
    Evaluate a single answer based on rubric with validation
    """
    try:
        logger.info(f"Evaluating answer using method: {request.rubric.method}")

        # Choose evaluator based on rubric method
        evaluator = get_evaluator(request.rubric.method)

        # Evaluate
        result = evaluator.evaluate(request.answer, request.rubric.dict())

        # Validate the evaluation (Skip for programming as it is deterministic output matching)
        if request.rubric.method != 'programming':
            validation = validator.validate_evaluation(result, request.rubric.dict())

            # If validation fails, adjust the result
            if not validation.get('validated', True):
                logger.warning(f"Evaluation validation failed: {validation.get('feedback', 'Unknown error')}")
                result['feedback'] = validation['feedback']
                result['confidence'] = max(0.1, result['confidence'] * 0.8)  # Reduce confidence

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
        validations = []
        for answer_request in request.answers:
            evaluator = get_evaluator(answer_request.rubric.method)
            result = evaluator.evaluate(answer_request.answer, answer_request.rubric.dict())

            if answer_request.rubric.method != 'programming':
                validation = validator.validate_evaluation(result, answer_request.rubric.dict())
                validations.append(validation)

                if not validation.get('validated', True):
                    logger.warning(
                        f"Batch evaluation validation failed: {validation.get('feedback', 'Unknown error')}"
                    )
                    result['feedback'] = validation.get('feedback', result.get('feedback', ''))
                    result['confidence'] = max(0.1, result.get('confidence', 0.5) * 0.8)
            
            results.append(EvaluationResponseSchema(
                score=result['score'],
                feedback=result['feedback'],
                evaluationMethod=result['evaluation_method'],
                confidence=result['confidence']
            ))
        
        return {
            'examId': request.examId,
            'results': results,
            'totalEvaluated': len(results),
            'validationSummary': validator.get_validation_stats(validations) if validations else {}
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
