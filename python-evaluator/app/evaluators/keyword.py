from typing import Dict, Any, List
from app.evaluators.base import BaseEvaluator
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

class KeywordEvaluator(BaseEvaluator):
    """Keyword-based evaluator for short answers"""
    
    def __init__(self, threshold: float = 0.5):
        """
        Initialize evaluator with threshold for passing
        
        Args:
            threshold: Minimum proportion of keywords needed to pass (0-1)
        """
        self.threshold = threshold
    
    def evaluate(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if student answer contains required keywords
        """
        keywords = rubric.get('keywords', [])
        
        if not keywords:
            return {
                'score': 0.5,
                'feedback': 'No keywords defined for grading',
                'evaluation_method': 'keyword',
                'confidence': 0.0
            }
        
        # Tokenize and clean student answer
        student_words = self._get_words(student_answer)
        
        # Count keyword matches (case-insensitive)
        matched_keywords = []
        for keyword in keywords:
            keyword_words = self._get_words(keyword)
            if self._contains_phrase(student_words, keyword_words):
                matched_keywords.append(keyword)
        
        # Calculate score
        score = len(matched_keywords) / len(keywords) if keywords else 0.0
        
        # Generate feedback
        if score == 1.0:
            feedback = 'Excellent! All key points covered.'
        elif score >= self.threshold:
            missing = [k for k in keywords if k not in matched_keywords]
            feedback = f'Good! Missing: {", ".join(missing)}'
        else:
            feedback = f'Insufficient. Found {len(matched_keywords)}/{len(keywords)} key points: {", ".join(matched_keywords)}'
        
        return {
            'score': score,
            'feedback': feedback,
            'evaluation_method': 'keyword',
            'confidence': min(0.95, 0.7 + len(matched_keywords) * 0.1)
        }
    
    def _get_words(self, text: str) -> List[str]:
        """Tokenize text into words"""
        try:
            words = word_tokenize(text.lower())
            # Remove stopwords and punctuation
            stop_words = set(stopwords.words('english'))
            return [w for w in words if w.isalnum() and w not in stop_words]
        except:
            # Fallback to simple split if NLTK fails
            return text.lower().split()
    
    def _contains_phrase(self, text_words: List[str], phrase_words: List[str]) -> bool:
        """Check if text contains phrase"""
        phrase_str = ' '.join(phrase_words)
        text_str = ' '.join(text_words)
        return phrase_str in text_str
