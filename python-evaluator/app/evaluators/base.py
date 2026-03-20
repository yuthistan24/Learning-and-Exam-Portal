from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseEvaluator(ABC):
    """Base class for all evaluators"""
    
    @abstractmethod
    def evaluate(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate a student's answer against rubric
        
        Returns: {
            'score': float (0 to 1),
            'feedback': str,
            'evaluation_method': str,
            'confidence': float (0 to 1)
        }
        """
        pass
