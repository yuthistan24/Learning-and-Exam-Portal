from typing import Dict, Any
from app.evaluators.base import BaseEvaluator

class ExactMatchEvaluator(BaseEvaluator):
    """Exact string matching evaluator for MCQ and simple questions"""
    
    def evaluate(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if student answer matches answer key exactly (case-insensitive)
        """
        student_answer = student_answer.strip().lower()
        answer_key = rubric.get('answerKey', '').strip().lower()
        
        is_correct = student_answer == answer_key
        
        return {
            'score': 1.0 if is_correct else 0.0,
            'feedback': 'Correct!' if is_correct else f'Expected: {rubric.get("answerKey", "N/A")}',
            'evaluation_method': 'exact',
            'confidence': 1.0
        }
