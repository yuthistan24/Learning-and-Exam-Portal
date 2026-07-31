"""
Ollama-based AI evaluator for subject-specific answer grading.
Uses local Ollama models with subject-optimized system prompts.
Falls back gracefully if Ollama is unreachable.
"""

import json
import re
import requests
from typing import Dict, Any, Optional
from app.evaluators.base import BaseEvaluator
from app.utils.logger import logger


# ── Subject routing config ────────────────────────────────────────────────────
SUBJECT_MODELS: Dict[str, str] = {
    "coding":        "qwen2.5-coder:1.5b-base",
    "programming":   "qwen2.5-coder:1.5b-base",
    "math":          "deepseek-r1:14b",
    "mathematics":   "deepseek-r1:14b",
    "english":       "qwen3.5:latest",
    "essay":         "qwen3.5:latest",
    "science":       "qwen3.5:latest",
    "general":       "qwen3.5:latest",
    "short_answer":  "qwen3.5:latest",
    "long_answer":   "qwen3.5:latest",
}

# System prompts tuned per subject
SYSTEM_PROMPTS: Dict[str, str] = {
    "coding": """You are an expert programming evaluator. Evaluate the student's code answer strictly.
Check: correctness, logic, efficiency, edge cases, and code quality.
Respond ONLY in valid JSON with keys: score (0.0-1.0), feedback (string, ≤3 sentences), confidence (0.0-1.0).
Example: {"score": 0.85, "feedback": "Logic is correct but lacks edge case handling.", "confidence": 0.92}""",

    "math": """You are an expert mathematics evaluator. Evaluate the student's mathematical answer.
Check: correctness of final answer, working/steps shown, formula usage, and unit handling.
Be strict about wrong answers but give partial credit for correct method with arithmetic errors.
Respond ONLY in valid JSON with keys: score (0.0-1.0), feedback (string, ≤3 sentences), confidence (0.0-1.0).
Example: {"score": 0.7, "feedback": "Method is correct but arithmetic error in step 3.", "confidence": 0.95}""",

    "english": """You are an expert English language and literature evaluator.
Evaluate the student's essay/answer for: content relevance, argument quality, language use, grammar, and structure.
Respond ONLY in valid JSON with keys: score (0.0-1.0), feedback (string, ≤4 sentences), confidence (0.0-1.0).
Example: {"score": 0.78, "feedback": "Good argument structure with minor grammatical issues.", "confidence": 0.88}""",

    "science": """You are an expert science evaluator. Evaluate the student's scientific answer.
Check: factual accuracy, use of correct terminology, completeness, and logical reasoning.
Respond ONLY in valid JSON with keys: score (0.0-1.0), feedback (string, ≤3 sentences), confidence (0.0-1.0).
Example: {"score": 0.9, "feedback": "Accurate and complete with proper terminology.", "confidence": 0.93}""",

    "general": """You are an expert academic evaluator. Evaluate the student's answer against the expected answer.
Check: relevance, accuracy, completeness, and depth of understanding.
Respond ONLY in valid JSON with keys: score (0.0-1.0), feedback (string, ≤3 sentences), confidence (0.0-1.0).
Example: {"score": 0.65, "feedback": "Partially correct. Missing key concepts about X.", "confidence": 0.85}""",
}


class OllamaEvaluator(BaseEvaluator):
    """
    LLM-based evaluator using locally-running Ollama models.
    Routes to the best model for each subject/question type.
    """

    def __init__(self, base_url: str = "http://localhost:11434", timeout: int = 60):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._available: Optional[bool] = None   # cached after first check

    # ── Public API ─────────────────────────────────────────────────────────────

    def evaluate(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        """Main evaluation entry point — routes to appropriate Ollama model."""
        subject = self._resolve_subject(rubric)
        model   = self._resolve_model(subject)

        if not student_answer or not student_answer.strip():
            return self._empty_response(subject)

        if not self.is_available():
            logger.warning("Ollama unavailable — returning placeholder AI evaluation")
            return self._unavailable_response(subject)

        try:
            result = self._call_ollama(student_answer, rubric, subject, model)
            result["model_used"] = model
            result["subject_evaluated"] = subject
            return result
        except Exception as exc:
            logger.error(f"OllamaEvaluator error: {exc}")
            return self._error_response(subject, str(exc))

    def is_available(self) -> bool:
        """Check if Ollama is reachable (cached per instance lifetime)."""
        if self._available is not None:
            return self._available
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=5)
            self._available = resp.status_code == 200
        except Exception:
            self._available = False
        logger.info(f"Ollama availability: {self._available}")
        return self._available

    def get_available_models(self) -> list:
        """Return list of installed model names."""
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if resp.status_code == 200:
                return [m["name"] for m in resp.json().get("models", [])]
        except Exception:
            pass
        return []

    # ── Internals ──────────────────────────────────────────────────────────────

    def _call_ollama(
        self,
        student_answer: str,
        rubric: Dict[str, Any],
        subject: str,
        model: str,
    ) -> Dict[str, Any]:
        system_prompt = SYSTEM_PROMPTS.get(subject, SYSTEM_PROMPTS["general"])
        user_prompt   = self._build_user_prompt(student_answer, rubric, subject)

        payload = {
            "model":  model,
            "prompt": user_prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,   # low temp → deterministic grading
                "num_predict": 256,
            },
        }

        resp = requests.post(
            f"{self.base_url}/api/generate",
            json=payload,
            timeout=self.timeout,
        )
        resp.raise_for_status()

        raw_text = resp.json().get("response", "")
        return self._parse_llm_response(raw_text, subject)

    def _build_user_prompt(
        self, student_answer: str, rubric: Dict[str, Any], subject: str
    ) -> str:
        answer_key   = rubric.get("answerKey", "")
        keywords     = rubric.get("keywords", [])
        sample_ans   = rubric.get("sampleAnswers", [])
        question_txt = rubric.get("questionText", "")

        parts = []
        if question_txt:
            parts.append(f"QUESTION:\n{question_txt}")
        if answer_key:
            parts.append(f"EXPECTED ANSWER / KEY:\n{answer_key}")
        if keywords:
            parts.append(f"KEY CONCEPTS TO COVER: {', '.join(keywords)}")
        if sample_ans:
            parts.append(f"SAMPLE ANSWER:\n{sample_ans[0]}")
        parts.append(f"STUDENT'S ANSWER:\n{student_answer}")
        parts.append("Now evaluate and respond in JSON only.")

        return "\n\n".join(parts)

    def _parse_llm_response(self, raw: str, subject: str) -> Dict[str, Any]:
        """Extract JSON from LLM output (handles fenced code blocks)."""
        # Strip markdown fences
        cleaned = re.sub(r"```(?:json)?", "", raw).replace("```", "").strip()

        # Find first valid JSON object
        match = re.search(r"\{[^{}]+\}", cleaned, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
                score = max(0.0, min(1.0, float(data.get("score", 0.5))))
                feedback = str(data.get("feedback", "Evaluated by AI."))[:500]
                confidence = max(0.0, min(1.0, float(data.get("confidence", 0.8))))
                return {
                    "score": score,
                    "feedback": feedback,
                    "confidence": confidence,
                    "evaluation_method": f"ollama_{subject}",
                }
            except (json.JSONDecodeError, ValueError, KeyError) as exc:
                logger.warning(f"JSON parse error from Ollama: {exc} — raw: {raw[:200]}")

        # Heuristic fallback: look for a score number in text
        score_match = re.search(r"\b([0-9](?:\.[0-9]+)?)\s*/\s*1\b", raw)
        if score_match:
            score = float(score_match.group(1))
            return {
                "score": score,
                "feedback": raw[:300].strip(),
                "confidence": 0.5,
                "evaluation_method": f"ollama_{subject}_heuristic",
            }

        return {
            "score": 0.5,
            "feedback": "AI evaluation completed but response format was unexpected.",
            "confidence": 0.3,
            "evaluation_method": f"ollama_{subject}_fallback",
        }

    # ── Helpers ────────────────────────────────────────────────────────────────

    @staticmethod
    def _resolve_subject(rubric: Dict[str, Any]) -> str:
        q_type  = (rubric.get("type") or rubric.get("question_type") or "").lower()
        subject = (rubric.get("subject") or "").lower()

        if q_type in ("programming", "coding") or subject in ("coding", "programming"):
            return "coding"
        if q_type in ("math", "mathematics") or subject in ("math", "mathematics"):
            return "math"
        if q_type in ("long_answer", "essay") or subject in ("english", "essay"):
            return "english"
        if subject in ("science", "physics", "chemistry", "biology"):
            return "science"
        return "general"

    @staticmethod
    def _resolve_model(subject: str) -> str:
        return SUBJECT_MODELS.get(subject, SUBJECT_MODELS["general"])

    @staticmethod
    def _empty_response(subject: str) -> Dict[str, Any]:
        return {
            "score": 0.0,
            "feedback": "No answer provided.",
            "confidence": 1.0,
            "evaluation_method": f"ollama_{subject}",
            "model_used": SUBJECT_MODELS.get(subject, "qwen3.5:latest"),
            "subject_evaluated": subject,
        }

    @staticmethod
    def _unavailable_response(subject: str) -> Dict[str, Any]:
        return {
            "score": 0.5,
            "feedback": "AI evaluation service is currently unavailable. Score is provisional pending manual review.",
            "confidence": 0.0,
            "evaluation_method": "ollama_unavailable",
            "model_used": "none",
            "subject_evaluated": subject,
        }

    @staticmethod
    def _error_response(subject: str, err: str) -> Dict[str, Any]:
        return {
            "score": 0.5,
            "feedback": f"AI evaluation encountered an error. Score is provisional. ({err[:80]})",
            "confidence": 0.1,
            "evaluation_method": "ollama_error",
            "model_used": SUBJECT_MODELS.get(subject, "qwen3.5:latest"),
            "subject_evaluated": subject,
        }
