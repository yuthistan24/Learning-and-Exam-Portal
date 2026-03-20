from typing import Dict, Any
from app.evaluators.base import BaseEvaluator
from sympy import sympify, simplify, solve, Eq, symbols
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
import re

class MathEvaluator(BaseEvaluator):
    """Mathematical expression evaluator using SymPy"""
    
    def evaluate(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate mathematical expressions for equivalence
        """
        answer_key = rubric.get('answerKey', '')
        
        if not answer_key or not student_answer:
            return {
                'score': 0.0,
                'feedback': 'Empty answer or no answer key provided',
                'evaluation_method': 'math',
                'confidence': 0.0
            }
        
        try:
            # Parse both expressions
            student_expr = self._parse_math_expr(student_answer)
            correct_expr = self._parse_math_expr(answer_key)
            
            if student_expr is None or correct_expr is None:
                return {
                    'score': 0.0,
                    'feedback': 'Invalid mathematical expression format',
                    'evaluation_method': 'math',
                    'confidence': 0.8
                }
            
            # Check if expressions are mathematically equivalent
            difference = simplify(student_expr - correct_expr)
            
            if difference == 0:
                return {
                    'score': 1.0,
                    'feedback': 'Correct! Mathematical expression is valid.',
                    'evaluation_method': 'math',
                    'confidence': 0.99
                }
            else:
                # Try numerical evaluation
                numerical_match = self._numerical_check(student_expr, correct_expr)
                if numerical_match:
                    return {
                        'score': 0.9,
                        'feedback': 'Mathematically equivalent, though in different form.',
                        'evaluation_method': 'math',
                        'confidence': 0.85
                    }
                else:
                    return {
                        'score': 0.0,
                        'feedback': f'Incorrect. Expected: {answer_key}',
                        'evaluation_method': 'math',
                        'confidence': 0.9
                    }
        
        except Exception as e:
            return {
                'score': 0.0,
                'feedback': f'Math evaluation error: {str(e)[:100]}',
                'evaluation_method': 'math',
                'confidence': 0.5
            }
    
    def _parse_math_expr(self, expr: str):
        """
        Parse mathematical expression safely
        """
        try:
            # Remove common whitespace and formatting
            expr = expr.strip()
            
            # Use SymPy parser with implicit multiplication
            transformations = (standard_transformations + (implicit_multiplication_application,))
            parsed = parse_expr(expr, transformations=transformations)
            
            return parsed
        except:
            # Try sympify as fallback
            try:
                return sympify(expr)
            except:
                return None
    
    def _numerical_check(self, expr1, expr2, test_points=5) -> bool:
        """
        Check if two expressions are numerically equivalent at several points
        """
        try:
            # Get free symbols from both expressions
            symbols_set = expr1.free_symbols.union(expr2.free_symbols)
            
            if not symbols_set:
                # Both are constants
                return float(expr1) == float(expr2)
            
            # Test at multiple points
            import random
            matches = 0
            
            for _ in range(test_points):
                # Create test values for each variable
                test_values = {sym: random.uniform(-10, 10) for sym in symbols_set}
                
                try:
                    val1 = float(expr1.subs(test_values))
                    val2 = float(expr2.subs(test_values))
                    
                    # Allow small floating-point error
                    if abs(val1 - val2) < 1e-6:
                        matches += 1
                except:
                    pass
            
            return matches >= test_points - 1  # Allow 1 failure
        except:
            return False
