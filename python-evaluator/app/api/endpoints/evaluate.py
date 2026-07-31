from fastapi import APIRouter, HTTPException
from app.api.schemas import (
    EvaluationRequestSchema,
    BatchEvaluationRequestSchema,
    EvaluationResponseSchema,
    HealthCheckResponseSchema,
)
from app.evaluators.subject_router import SubjectRouter
from app.evaluators.ollama_evaluator import OllamaEvaluator
from app.config import config
from app.utils.logger import logger

router = APIRouter(prefix="/api", tags=["evaluation"])

# Single shared SubjectRouter instance (initializes Ollama connection on startup)
subject_router = SubjectRouter()
_ollama_evaluator = subject_router.ollama_eval


def _to_response(result: dict) -> EvaluationResponseSchema:
    """Convert internal evaluation dict to API response schema."""
    return EvaluationResponseSchema(
        score=float(result.get("score", 0.0)),
        feedback=str(result.get("feedback", "")),
        evaluationMethod=str(result.get("evaluation_method", "unknown")),
        confidence=float(result.get("confidence", 0.0)),
        modelUsed=str(result.get("model_used", "none")),
        subjectEvaluated=str(result.get("subject_evaluated", "general")),
        testResults=result.get("test_results", []),
    )


@router.post("/evaluate", response_model=EvaluationResponseSchema)
async def evaluate_answer(request: EvaluationRequestSchema):
    """
    Evaluate a single answer using the subject-aware router.
    Automatically selects the best evaluator pipeline based on question_type and subject.
    """
    try:
        logger.info(
            f"Evaluating answer | type={request.question_type} | subject={request.subject}"
        )

        # Merge question metadata into rubric for evaluators that need it
        rubric_dict = request.rubric.dict()
        rubric_dict["type"]         = request.question_type
        rubric_dict["subject"]      = request.subject
        rubric_dict["questionText"] = request.question or rubric_dict.get("questionText", "")

        result = subject_router.evaluate(request.answer, rubric_dict)

        logger.info(
            f"Evaluation complete | score={result.get('score')} | "
            f"method={result.get('evaluation_method')} | model={result.get('model_used')}"
        )

        return _to_response(result)

    except Exception as exc:
        logger.error(f"Evaluation error: {exc}")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(exc)}")


@router.post("/evaluate/batch")
async def batch_evaluate(request: BatchEvaluationRequestSchema):
    """
    Batch evaluate multiple answers (called on exam submission).
    Returns per-answer results plus a summary.
    """
    try:
        logger.info(
            f"Batch evaluating {len(request.answers)} answers | exam={request.examId}"
        )

        results = []
        total_score = 0.0
        total_confidence = 0.0

        for answer_request in request.answers:
            rubric_dict = answer_request.rubric.dict()
            rubric_dict["type"]         = answer_request.question_type
            rubric_dict["subject"]      = answer_request.subject or "general"
            rubric_dict["questionText"] = answer_request.question or ""

            result = subject_router.evaluate(answer_request.answer, rubric_dict)
            resp   = _to_response(result)
            results.append(resp)
            total_score     += resp.score
            total_confidence += resp.confidence

        count = len(results)
        return {
            "examId":        request.examId,
            "results":       results,
            "totalEvaluated": count,
            "averageScore":  round(total_score / count, 3) if count else 0,
            "averageConfidence": round(total_confidence / count, 3) if count else 0,
            "ollamaUsed":    _ollama_evaluator.is_available(),
        }

    except Exception as exc:
        logger.error(f"Batch evaluation error: {exc}")
        raise HTTPException(status_code=500, detail=f"Batch evaluation failed: {str(exc)}")


@router.post("/evaluate/single")
async def evaluate_single_answer(request: EvaluationRequestSchema):
    """Alias for /evaluate — convenience endpoint."""
    return await evaluate_answer(request)


@router.get("/health", response_model=HealthCheckResponseSchema)
async def health_check():
    """Health check — also reports Ollama status and installed models."""
    ollama_ok = _ollama_evaluator.is_available()
    models    = _ollama_evaluator.get_available_models() if ollama_ok else []
    return HealthCheckResponseSchema(
        status="healthy",
        ollamaAvailable=ollama_ok,
        availableModels=models,
    )
