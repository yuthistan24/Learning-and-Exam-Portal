import sys
import io
import contextlib
import subprocess
import tempfile
import os
from typing import Dict, Any, List
from app.evaluators.base import BaseEvaluator

class ProgrammingEvaluator(BaseEvaluator):
    """
    Evaluator for programming questions.
    Executes student code against test cases and compares output.
    Supports C, C++, Java, and Python.
    """
    
    def evaluate(self, student_answer: str, rubric: Dict[str, Any]) -> Dict[str, Any]:
        test_cases = rubric.get('test_cases') or rubric.get('testCases') or []
        language = rubric.get('language') or self._detect_language(student_answer)
        
        if not test_cases:
            return {
                'score': 0.0,
                'feedback': 'No test cases defined for this programming question.',
                'evaluation_method': 'programming',
                'confidence': 1.0,
                'test_results': []
            }
            
        passed_count = 0
        total_weight = 0
        earned_weight = 0
        results = []
        test_results_detailed = []
        
        # Compile if needed
        compile_success, exe_path, compile_err = self._compile_code(student_answer, language)
        if not compile_success:
            return {
                'score': 0.0,
                'feedback': f"Compilation Error:\n{compile_err}",
                'evaluation_method': 'programming',
                'confidence': 1.0,
                'test_results': [{'input': tc.get('input', ''), 'expected': tc.get('expectedOutput', tc.get('expected_output', '')), 'actual': compile_err, 'passed': False} for tc in test_cases]
            }

        try:
            for idx, tc in enumerate(test_cases):
                input_val = tc.get('input', '')
                expected = tc.get('expectedOutput', tc.get('expected_output', '')).strip()
                weight = tc.get('weight', 1.0)
                total_weight += weight
                
                # Execute code
                success, actual_output, error_msg = self._run_compiled_code(exe_path, language, student_answer, input_val)
                actual_output = actual_output.strip()
                
                test_result = {
                    'input': input_val,
                    'expected': expected,
                    'actual': actual_output if success else error_msg,
                    'passed': False
                }

                if success:
                    if actual_output == expected:
                        passed_count += 1
                        earned_weight += weight
                        results.append(f"Test Case {idx+1}: Passed")
                        test_result['passed'] = True
                    else:
                        results.append(f"Test Case {idx+1}: Failed")
                else:
                    results.append(f"Test Case {idx+1}: Runtime Error")
                    
                test_results_detailed.append(test_result)
                    
            final_score = earned_weight / total_weight if total_weight > 0 else 0.0
            
            if final_score == 1.0:
                feedback = "All test cases passed! Perfect solution."
            elif final_score > 0:
                feedback = f"Some test cases failed. {passed_count}/{len(test_cases)} passed."
            else:
                feedback = "All test cases failed or code had errors."
                
            return {
                'score': final_score,
                'feedback': feedback,
                'evaluation_method': 'programming',
                'confidence': 1.0,
                'test_results': test_results_detailed
            }
        finally:
            self._cleanup(exe_path, language)

    def _detect_language(self, code: str) -> str:
        if '#include <iostream>' in code or 'using namespace std;' in code:
            return 'cpp'
        elif '#include <stdio.h>' in code:
            return 'c'
        elif 'public class' in code and 'public static void main' in code:
            return 'java'
        else:
            return 'python'

    def _compile_code(self, code: str, language: str):
        if language == 'python':
            return True, None, ""
            
        temp_dir = tempfile.mkdtemp()
        
        if language == 'c':
            src_path = os.path.join(temp_dir, 'main.c')
            exe_path = os.path.join(temp_dir, 'main.out')
            with open(src_path, 'w') as f: f.write(code)
            proc = subprocess.run(['gcc', src_path, '-o', exe_path], capture_output=True, text=True)
            if proc.returncode != 0: return False, None, proc.stderr
            return True, exe_path, ""
            
        elif language == 'cpp':
            src_path = os.path.join(temp_dir, 'main.cpp')
            exe_path = os.path.join(temp_dir, 'main.out')
            with open(src_path, 'w') as f: f.write(code)
            proc = subprocess.run(['g++', src_path, '-o', exe_path], capture_output=True, text=True)
            if proc.returncode != 0: return False, None, proc.stderr
            return True, exe_path, ""
            
        elif language == 'java':
            import re
            match = re.search(r'public\s+class\s+(\w+)', code)
            class_name = match.group(1) if match else 'Main'
            src_path = os.path.join(temp_dir, f'{class_name}.java')
            with open(src_path, 'w') as f: f.write(code)
            proc = subprocess.run(['javac', src_path], capture_output=True, text=True)
            if proc.returncode != 0: return False, None, proc.stderr
            return True, temp_dir + "|" + class_name, ""
            
        return False, None, f"Unsupported language: {language}"

    def _run_compiled_code(self, exe_path: str, language: str, code: str, input_data: str):
        try:
            if language == 'python':
                proc = subprocess.run([sys.executable, '-c', code], input=input_data, capture_output=True, text=True, timeout=5)
            elif language == 'java':
                temp_dir, class_name = exe_path.split('|')
                proc = subprocess.run(['java', '-cp', temp_dir, class_name], input=input_data, capture_output=True, text=True, timeout=5)
            else:
                proc = subprocess.run([exe_path], input=input_data, capture_output=True, text=True, timeout=5)
                
            if proc.returncode != 0:
                return False, proc.stdout, proc.stderr
            return True, proc.stdout, ""
        except subprocess.TimeoutExpired:
            return False, "", "Execution Timed Out"
        except Exception as e:
            return False, "", str(e)
            
    def _cleanup(self, exe_path: str, language: str):
        try:
            if not exe_path: return
            if language == 'java':
                temp_dir = exe_path.split('|')[0]
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
            else:
                import shutil
                shutil.rmtree(os.path.dirname(exe_path), ignore_errors=True)
        except:
            pass
