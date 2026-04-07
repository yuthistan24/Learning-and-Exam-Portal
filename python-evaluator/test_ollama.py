import os
import fitz  # PyMuPDF
from langchain_community.llms import Ollama
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate

# Path to the syllabus in the parent directory
SYLLABUS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "syllabus.pdf")
MODELS = ["deepseek-r1", "qwen2.5:0.5b-instruct", "codellama"]

def load_pdf_text(filepath, max_pages=None):
    """Extract text from the PDF file."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Cannot find syllabus at: {filepath}")
    
    doc = fitz.open(filepath)
    text = ""
    num_pages = min(max_pages, len(doc)) if max_pages else len(doc)
    
    for page_num in range(num_pages):
        page = doc.load_page(page_num)
        text += page.get_text()
    
    return text

def initialize_llm(model_name=MODELS[0]):
    """Initialize LangChain Ollama connection."""
    print(f"Connecting to Ollama using model: {model_name}...")
    try:
        # We start with deepseek-r1, let's just attempt connection.
        # LangChain doesn't strictly fail on init, it fails on run if model doesn't exist.
        return Ollama(model=model_name)
    except Exception as e:
        print(f"Failed to connect: {e}")
        return None

def generate_questions_from_text(llm, context_text):
    """Generate exam questions based on the provided text chunk."""
    prompt_template = PromptTemplate(
        input_variables=["context"],
        template=(
            "You are an expert curriculum developer. Based on the following syllabus excerpt, "
            "generate 3 Multiple Choice Questions (MCQs) and 2 Short Answer questions.\n\n"
            "Format the output strictly as:\n"
            "MCQs:\n"
            "1. [Question]? A) [opt] B) [opt] C) [opt] D) [opt] | Correct: [Answer]\n...\n"
            "Short Answer:\n"
            "1. [Question]?\n...\n\n"
            "Syllabus Excerpt:\n{context}"
        )
    )
    
    print("\nGenerating questions... (This may take a minute depending on your hardware)\n")
    # Limiting context to avoid token issues for standard models
    response = llm(prompt_template.format(context=context_text[:4000]))
    return response

if __name__ == "__main__":
    print("-" * 50)
    print("Syllabus Processor & Question Generator (Ollama)")
    print("-" * 50)
    
    llm = initialize_llm()
    
    print("\nExtracting text from syllabus.pdf (first 10 pages to minimize load)...")
    try:
        syllabus_text = load_pdf_text(SYLLABUS_PATH, max_pages=10)
        print(f"Extracted {len(syllabus_text)} characters.")
        
        # We can chunk it up, but for testing we'll just evaluate the first big chunk.
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=3000, chunk_overlap=200)
        chunks = text_splitter.split_text(syllabus_text)
        
        if not chunks:
            print("No text could be extracted!")
        else:
            print(f"Created {len(chunks)} text chunks.")
            
            user_input = input("\nPress ENTER to test generating questions from the first chunk (or type 'quit')... ")
            if user_input.lower() != 'quit':
                result = generate_questions_from_text(llm, chunks[0])
                print("\n=== GENERATED QUESTIONS ===")
                print(result)
                print("===========================")
                
    except Exception as e:
        print(f"Error reading PDF: {e}")
