"""
SubjectRouter — dispatches each answer to the optimal evaluator pipeline.

Pipeline per type:
  mcq          → ExactMatch (deterministic, no LLM needed)
  programming  → ProgrammingEvaluator (run code) + OllamaEvaluator (code-review)
  math         → MathEvaluator (SymPy) + OllamaEvaluator (step reasoning)
  long_answer  → SemanticEvaluator (TF-IDF) + OllamaEvaluator (essay grading)
  short_answer → KeywordEvaluator + OllamaEvaluator (factual check)
  default      → KeywordEvaluator + OllamaEvaluator
"""

from typing import Dict, Any

from app.evaluators.exact import ExactMatchEvaluator
from app.evaluators.keyword import KeywordEvaluator
from app.evaluators.semantic import SemanticEvaluator
from app.evaluators.math import MathEvaluator
from app.evaluators.programming import ProgrammingEvaluator
from app.evaluators.ollama_evaluator import OllamaEvaluator
from app.config import config
from app.utils.logger import logger


class SubjectRouter:
    """
    Routes an evaluation request to the best evaluator combination,
    then blends scores for a final result.
    """

    def __init__(self):
        self.exact_eval       = ExactMatchEvaluator()
        self.keyword_eval     = KeywordEvaluator(threshold=0.5)
        self.semantic_eval    = SemanticEvaluator()
        self.math_eval        = MathEvaluator()
        self.programming_eval = ProgrammingEvaluator()
        self.ollama_eval      = OllamaEvaluator(
            base_url=config.OLLAMA_BASE_URL,
            timeout=config.EVALUATION_TIMEOUT,
        )
        logger.info(
            f"SubjectRouter initialized. Ollama available: {self.ollama_eval.is_available()}"
        )

    # ── Public entry point ────────────────────────────────────────────────────

    def evaluate(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        q_type = (rubric.get("type") or rubric.get("question_type") or "short_answer").lower()

        if q_type == "mcq":
            return self._eval_mcq(student_answer, rubric)
        elif q_type in ("programming", "coding"):
            return self._eval_programming(student_answer, rubric)
        elif q_type in ("math", "mathematics"):
            return self._eval_math(student_answer, rubric)
        elif q_type == "long_answer":
            return self._eval_long_answer(student_answer, rubric)
        else:
            return self._eval_short_answer(student_answer, rubric)

    # ── Pipeline methods ──────────────────────────────────────────────────────

    def _eval_mcq(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        """MCQ is always exact-match — no LLM needed."""
        result = self.exact_eval.evaluate(student_answer, rubric)
        result["evaluation_method"] = "exact_mcq"
        result["model_used"] = "none"
        result["subject_evaluated"] = "mcq"
        return result

    def _eval_programming(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run code against test cases, then get an LLM code-review on top.
        Blend: 80% test-case result + 20% LLM code-review.
        """
        prog_result = self.programming_eval.evaluate(student_answer, rubric)
        prog_score  = prog_result.get("score", 0.0)

        # Enrich rubric with type/subject for Ollama routing
        ollama_rubric = {**rubric, "type": "programming", "subject": "coding"}

        if self.ollama_eval.is_available():
            llm_result = self.ollama_eval.evaluate(student_answer, ollama_rubric)
            llm_score  = llm_result.get("score", prog_score)

            blended_score = 0.80 * prog_score + 0.20 * llm_score
            blended_feedback = (
                prog_result.get("feedback", "") +
                f" AI Review: {llm_result.get('feedback', '')}"
            )
            return {
                "score": round(blended_score, 3),
                "feedback": blended_feedback[:600],
                "evaluation_method": "programming+ollama",
                "confidence": llm_result.get("confidence", 0.85),
                "test_results": prog_result.get("test_results", []),
                "model_used": llm_result.get("model_used", "none"),
                "subject_evaluated": "programming",
            }

        prog_result["model_used"] = "none"
        prog_result["subject_evaluated"] = "programming"
        return prog_result

    def _eval_math(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        """
        SymPy for symbolic equivalence, Ollama for step-by-step verification.
        Blend: 70% SymPy + 30% LLM.
        """
        sympy_result = self.math_eval.evaluate(student_answer, rubric)
        sympy_score  = sympy_result.get("score", 0.0)

        ollama_rubric = {**rubric, "type": "math", "subject": "math"}

        if self.ollama_eval.is_available():
            llm_result = self.ollama_eval.evaluate(student_answer, ollama_rubric)
            llm_score  = llm_result.get("score", sympy_score)

            blended_score = 0.70 * sympy_score + 0.30 * llm_score
            blended_feedback = (
                sympy_result.get("feedback", "") +
                f" Reasoning: {llm_result.get('feedback', '')}"
            )
            return {
                "score": round(blended_score, 3),
                "feedback": blended_feedback[:500],
                "evaluation_method": "sympy+ollama_math",
                "confidence": max(sympy_result.get("confidence", 0.9),
                                  llm_result.get("confidence", 0.8)),
                "model_used": llm_result.get("model_used", "none"),
                "subject_evaluated": "math",
            }

        sympy_result["model_used"] = "none"
        sympy_result["subject_evaluated"] = "math"
        return sympy_result

    def _eval_long_answer(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        """
        TF-IDF semantic similarity + Ollama essay grading.
        Blend: 40% TF-IDF + 60% LLM (essays need deeper understanding).
        """
        sem_result = self.semantic_eval.evaluate(student_answer, rubric)
        sem_score  = sem_result.get("score", 0.0)

        subject = (rubric.get("subject") or "english").lower()
        ollama_rubric = {**rubric, "type": "long_answer", "subject": subject}

        if self.ollama_eval.is_available():
            llm_result = self.ollama_eval.evaluate(student_answer, ollama_rubric)
            llm_score  = llm_result.get("score", sem_score)

            blended_score = 0.40 * sem_score + 0.60 * llm_score
            return {
                "score": round(blended_score, 3),
                "feedback": llm_result.get("feedback", sem_result.get("feedback", "")),
                "evaluation_method": f"semantic+ollama_{subject}",
                "confidence": llm_result.get("confidence", sem_result.get("confidence", 0.75)),
                "model_used": llm_result.get("model_used", "none"),
                "subject_evaluated": subject,
            }

        sem_result["model_used"] = "none"
        sem_result["subject_evaluated"] = subject
        return sem_result

    def _eval_short_answer(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        """
        Keyword matching + Ollama factual verification.
        Blend: 50% keyword + 50% LLM.
        """
        kw_result = self.keyword_eval.evaluate(student_answer, rubric)
        kw_score  = kw_result.get("score", 0.0)

        subject = (rubric.get("subject") or "general").lower()
        ollama_rubric = {**rubric, "type": "short_answer", "subject": subject}

        if self.ollama_eval.is_available():
            llm_result = self.ollama_eval.evaluate(student_answer, ollama_rubric)
            llm_score  = llm_result.get("score", kw_score)

            blended_score = 0.50 * kw_score + 0.50 * llm_score
            return {
                "score": round(blended_score, 3),
                "feedback": llm_result.get("feedback", kw_result.get("feedback", "")),
                "evaluation_method": f"keyword+ollama_{subject}",
                "confidence": llm_result.get("confidence", kw_result.get("confidence", 0.7)),
                "model_used": llm_result.get("model_used", "none"),
                "subject_evaluated": subject,
            }

        kw_result["model_used"] = "none"
        kw_result["subject_evaluated"] = subject
        return kw_result
