from fastapi import APIRouter, HTTPException, Request
import fitz
from app.utils.logger import logger

router = APIRouter(prefix="/api/ocr", tags=["ocr"])


@router.post("/extract")
async def extract_text(request: Request):
    """
    Extract text from a PDF. If no text layer exists, run OCR locally (Tesseract).
    """
    data = await request.body()
    if not data:
        raise HTTPException(status_code=400, detail="No PDF data provided")

    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as e:
        logger.error(f"OCR open error: {e}")
        raise HTTPException(status_code=400, detail="Invalid PDF data")

    text_parts = []
    for page_index in range(len(doc)):
        page = doc[page_index]
        text = page.get_text("text") or ""
        if text.strip():
            text_parts.append(text)
            continue

        try:
            textpage = page.get_textpage_ocr(language="eng", dpi=200)
            ocr_text = textpage.extractText() if textpage else ""
            text_parts.append(ocr_text)
        except Exception as e:
            logger.warning(f"OCR failed on page {page_index + 1}: {e}")
            text_parts.append("")

    return {
        "text": "".join(text_parts),
        "numPages": len(doc)
    }

