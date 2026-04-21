import sys
import io
import contextlib
from typing import Dict, Any, List
from app.evaluators.base import BaseEvaluator

class ProgrammingEvaluator(BaseEvaluator):
    """
    Evaluator for programming questions.
    Executes student code against test cases and compares output.
    """
    
    def evaluate(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        test_cases = rubric.get('test_cases') or rubric.get('testCases') or []
        
        if not test_cases:
            return {
                'score': 0.0,
                'feedback': 'No test cases defined for this programming question.',
                'evaluation_method': 'programming',
                'confidence': 1.0
            }
            
        passed_count = 0
        total_weight = 0
        earned_weight = 0
        results = []
        
        for idx, tc in enumerate(test_cases):
            input_val = tc.get('input', '')
            expected = tc.get('expectedOutput', tc.get('expected_output', '')).strip()
            weight = tc.get('weight', 1.0)
            total_weight += weight
            
            # Execute code
            success, actual_output, error_msg = self._run_python_code(student_answer, input_val)
            
            if success:
                actual_output = actual_output.strip()
                if actual_output == expected:
                    passed_count += 1
                    earned_weight += weight
                    results.append(f"Test Case {idx+1}: Passed")
                else:
                    results.append(f"Test Case {idx+1}: Failed (Expected '{expected}', got '{actual_output}')")
            else:
                results.append(f"Test Case {idx+1}: Runtime Error ({error_msg})")
                
        final_score = earned_weight / total_weight if total_weight > 0 else 0.0
        
        # Determine feedback
        if final_score == 1.0:
            feedback = "All test cases passed! Perfect solution."
        elif final_score > 0:
            feedback = f"Some test cases failed. {passed_count}/{len(test_cases)} passed.\n" + "\n".join(results)
        else:
            feedback = "All test cases failed or code had errors.\n" + "\n".join(results)
            
        return {
            'score': final_score,
            'feedback': feedback,
            'evaluation_method': 'programming',
            'confidence': 1.0
        }
        
    def _run_python_code(self, code: str, input_data: str) -> (bool, str, str):
        """
        Runs python code safely (simulated) and captures output.
        In a production environment, this should run in a sandbox/container.
        """
        output_buffer = io.StringIO()
        
        # Mocking input()
        input_lines = input_data.splitlines()
        input_idx = 0
        
        def mocked_input(prompt=""):
            nonlocal input_idx
            if input_idx < len(input_lines):
                val = input_lines[input_idx]
                input_idx += 1
                return val
            return ""

        # Restricted environment
        safe_globals = {
            "__builtins__": {
                "print": print,
                "range": range,
                "len": len,
                "int": int,
                "str": str,
                "float": float,
                "list": list,
                "dict": dict,
                "set": set,
                "tuple": tuple,
                "abs": abs,
                "min": min,
                "max": max,
                "sum": sum,
                "sorted": sorted,
                "enumerate": enumerate,
                "zip": zip,
                "input": mocked_input,
                "bool": bool,
                "map": map,
                "filter": filter,
                "round": round,
                "any": any,
                "all": all
            }
        }
        
        try:
            with contextlib.redirect_stdout(output_buffer):
                # We use a wrapper to handle the mocked input if the students use it
                # and to capture the prints.
                exec(code, safe_globals)
            return True, output_buffer.getvalue(), ""
        except Exception as e:
            return False, "", str(e)
