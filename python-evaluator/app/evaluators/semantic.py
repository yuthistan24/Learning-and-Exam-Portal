from typing import Dict, Any
from app.evaluators.base import BaseEvaluator
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class SemanticEvaluator(BaseEvaluator):
    """Semantic similarity evaluator using TF-IDF for short/medium answers"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words='english',
            max_features=500,
            ngram_range=(1, 2)
        )
    
    def evaluate(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate semantic similarity using TF-IDF cosine similarity
        """
        answer_key = rubric.get('answerKey', '')
        
        if not answer_key or not student_answer:
            return {
                'score': 0.0,
                'feedback': 'Empty answer or no answer key provided',
                'evaluation_method': 'semantic',
                'confidence': 0.0
            }
        
        try:
            # Vectorize both texts
            corpus = [student_answer, answer_key]
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            
            # Calculate cosine similarity
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            # Normalize to 0-1 range and apply threshold
            score = max(0, similarity)
            
            # Generate feedback based on score
            if score >= 0.85:
                feedback = 'Excellent match!'
            elif score >= 0.70:
                feedback = 'Good answer with minor differences'
            elif score >= 0.50:
                feedback = 'Partially correct. Some key points missing.'
            else:
                feedback = 'Insufficient. Answer does not align with expected response.'
            
            # Confidence based on similarity and answer length
            confidence = min(0.95, 0.6 + (len(student_answer) / 500))
            
            return {
                'score': score,
                'feedback': feedback,
                'evaluation_method': 'semantic',
                'confidence': confidence
            }
        except Exception as e:
            return {
                'score': 0.5,
                'feedback': f'Evaluation error: {str(e)}',
                'evaluation_method': 'semantic',
                'confidence': 0.0
            }
