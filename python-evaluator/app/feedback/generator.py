from typing import Dict, Any

class FeedbackGenerator:
    """Generate contextual feedback based on evaluation scores"""
    
    FEEDBACK_TEMPLATES = {
        'excellent': {
            'threshold': 0.9,
            'message': 'Excellent work! Your answer is comprehensive and accurate.'
        },
        'good': {
            'threshold': 0.7,
            'message': 'Good answer! You have covered the main points.'
        },
        'fair': {
            'threshold': 0.5,
            'message': 'Fair attempt. You have covered some key points, but there is room for improvement.'
        },
        'poor': {
            'threshold': 0.0,
            'message': 'Your answer needs significant improvement. Review the key concepts.'
        }
    }
    
    @classmethod
    def generate(cls, score: float, method: str, context: Dict[str, Any] = None) -> str:
        """
        Generate feedback based on score and evaluation method
        
        Args:
            score: Evaluation score (0-1)
            method: Evaluation method (exact, keyword, semantic, math)
            context: Additional context for feedback
        
        Returns:
            Feedback string
        """
        base_feedback = cls._get_base_feedback(score)
        method_specific = cls._get_method_specific_feedback(method, score)
        
        return f"{base_feedback} {method_specific}".strip()
    
    @classmethod
    def _get_base_feedback(cls, score: float) -> str:
        """Get base feedback based on score threshold"""
        for level, config in cls.FEEDBACK_TEMPLATES.items():
            if score >= config['threshold']:
                return config['message']
        
        return cls.FEEDBACK_TEMPLATES['poor']['message']
    
    @classmethod
    def _get_method_specific_feedback(cls, method: str, score: float) -> str:
        """Add method-specific feedback"""
        if method == 'exact':
            return "This is an exact match evaluation." if score == 1.0 else "Check the answer key for the correct response."
        
        elif method == 'keyword':
            if score == 1.0:
                return "All required keywords were found in your answer."
            elif score > 0.5:
                return "Try to include all the important keywords in your answer."
            else:
                return "Your answer is missing important keywords. Review them and try again."
        
        elif method == 'semantic':
            if score > 0.85:
                return "Your answer is semantically equivalent to the model answer."
            elif score > 0.5:
                return "Your answer covers some of the same concepts but could be improved."
            else:
                return "Your answer does not align well with the expected response. Review and try again."
        
        elif method == 'math':
            if score == 1.0:
                return "Your mathematical expression is correct."
            else:
                return "Your mathematical expression is incorrect. Check your calculations."
        
        return ""
