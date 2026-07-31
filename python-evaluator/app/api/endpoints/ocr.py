"""
OCR endpoints — extract text from uploaded PDF or image files.

Endpoints:
  POST /api/ocr/extract   — PDF → text (PyMuPDF text layer, then pytesseract fallback)
  POST /api/ocr/image     — Image file (PNG/JPG/BMP/TIFF) → text via pytesseract
"""

import io
import fitz                          # PyMuPDF
from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from app.utils.logger import logger

router = APIRouter(prefix="/api/ocr", tags=["ocr"])

# ── pytesseract (optional — graceful degradation if not installed) ───────────
try:
    import pytesseract
    from PIL import Image

    # Common Windows Tesseract install path
    import os
    _TESS_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(_TESS_PATH):
        pytesseract.pytesseract.tesseract_cmd = _TESS_PATH

    PYTESSERACT_AVAILABLE = True
    logger.info("pytesseract is available")
except ImportError:
    PYTESSERACT_AVAILABLE = False
    logger.warning("pytesseract not available — image OCR will be disabled")


# ── helpers ───────────────────────────────────────────────────────────────────

def _ocr_page_with_tesseract(page: fitz.Page) -> str:
    """Render a PDF page to a PIL image and run pytesseract on it."""
    if not PYTESSERACT_AVAILABLE:
        return ""
    try:
        mat = fitz.Matrix(2.0, 2.0)           # 2× zoom → better OCR accuracy
        pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        return pytesseract.image_to_string(img, lang="eng", config="--psm 6")
    except Exception as exc:
        logger.warning(f"pytesseract page render failed: {exc}")
        return ""


def _ocr_image_bytes(data: bytes, content_type: str = "image/png") -> str:
    """Run pytesseract on raw image bytes."""
    if not PYTESSERACT_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="pytesseract is not installed on this server. "
                   "Please install Tesseract-OCR and pytesseract.",
        )
    try:
        img = Image.open(io.BytesIO(data))
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        text = pytesseract.image_to_string(img, lang="eng", config="--psm 6")
        return text.strip()
    except Exception as exc:
        logger.error(f"Image OCR error: {exc}")
        raise HTTPException(status_code=422, detail=f"Image OCR failed: {str(exc)}")


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.post("/extract")
async def extract_pdf_text(request: Request):
    """
    Extract text from a PDF.
    • If the PDF has a native text layer → use PyMuPDF directly.
    • Otherwise fall back to pytesseract (via page image rendering).
    Accepts raw PDF bytes in the request body (Content-Type: application/pdf).
    """
    data = await request.body()
    if not data:
        raise HTTPException(status_code=400, detail="No PDF data provided")

    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:
        logger.error(f"PDF open error: {exc}")
        raise HTTPException(status_code=400, detail="Invalid or corrupted PDF")

    text_parts = []
    ocr_pages  = 0

    for page_index in range(len(doc)):
        page = doc[page_index]
        text = page.get_text("text") or ""

        if text.strip():
            text_parts.append(text)
        else:
            # No text layer — try PyMuPDF built-in OCR first, then pytesseract
            ocr_text = ""
            try:
                textpage = page.get_textpage_ocr(language="eng", dpi=200)
                ocr_text = textpage.extractText() if textpage else ""
            except Exception:
                pass

            if not ocr_text.strip():
                ocr_text = _ocr_page_with_tesseract(page)
                if ocr_text:
                    ocr_pages += 1

            text_parts.append(ocr_text)

    combined = "\n".join(text_parts)
    return {
        "text":          combined.strip(),
        "numPages":      len(doc),
        "ocrPages":      ocr_pages,
        "pytesseractUsed": ocr_pages > 0,
    }


@router.post("/image")
async def extract_image_text(file: UploadFile = File(...)):
    """
    Extract text from an uploaded image file (PNG, JPG, JPEG, BMP, TIFF, WEBP).
    Uses pytesseract for OCR.
    """
    if not PYTESSERACT_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="pytesseract / Tesseract-OCR is not installed on this server.",
        )

    allowed_types = {
        "image/png", "image/jpeg", "image/jpg",
        "image/bmp", "image/tiff", "image/webp",
    }
    ct = (file.content_type or "").lower()
    if ct and ct not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ct}'. Allowed: PNG, JPG, BMP, TIFF, WEBP.",
        )

    try:
        data = await file.read()
        text = _ocr_image_bytes(data, ct)
        return {
            "text":       text,
            "filename":   file.filename,
            "characters": len(text),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Image OCR endpoint error: {exc}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(exc)}")


@router.get("/status")
async def ocr_status():
    """Report OCR capabilities available on this server."""
    return {
        "pytesseractAvailable": PYTESSERACT_AVAILABLE,
        "pymupdfAvailable":     True,
        "supportedFormats":     ["pdf", "png", "jpg", "jpeg", "bmp", "tiff", "webp"]
        if PYTESSERACT_AVAILABLE else ["pdf"],
    }
