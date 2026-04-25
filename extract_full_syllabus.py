import fitz
import json

def extract_syllabus(pdf_path):
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    
    with open('syllabus_full_text.txt', 'w', encoding='utf-8') as f:
        f.write(full_text)
    
    print(f"Extracted {len(full_text)} characters.")

if __name__ == "__main__":
    extract_syllabus('syllabus.pdf')
