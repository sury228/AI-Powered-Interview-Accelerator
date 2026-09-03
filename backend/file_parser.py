"""
File upload handling.
Extracts text from PDF, DOCX, and plain text files.
"""

import io
from PyPDF2 import PdfReader
from docx import Document


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text content from a PDF file."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        text = "\n".join(text_parts)
        if not text.strip():
            raise ValueError("PDF appears to contain no extractable text (may be image-based).")
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {e}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text content from a DOCX file."""
    try:
        doc = Document(io.BytesIO(file_bytes))
        text_parts = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text)
        # Also extract text from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    text_parts.append(row_text)
        text = "\n".join(text_parts)
        if not text.strip():
            raise ValueError("DOCX appears to contain no text.")
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX: {e}")


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Extract text from an uploaded file based on its extension.
    Supports: .pdf, .docx, .doc, .txt
    """
    filename_lower = filename.lower()

    if filename_lower.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif filename_lower.endswith((".docx", ".doc")):
        return extract_text_from_docx(file_bytes)
    elif filename_lower.endswith(".txt"):
        return file_bytes.decode("utf-8", errors="replace").strip()
    else:
        # Try to decode as plain text
        try:
            return file_bytes.decode("utf-8", errors="replace").strip()
        except Exception:
            raise ValueError(f"Unsupported file type: {filename}. Please upload PDF, DOCX, or TXT.")
