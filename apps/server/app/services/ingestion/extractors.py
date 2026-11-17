import io
from pathlib import PurePath

from docx import Document
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from app.core.errors import BadRequestError

SUPPORTED_EXTENSIONS = (".pdf", ".docx", ".txt", ".md")


def _from_pdf(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)
    except PdfReadError as exc:
        raise BadRequestError("The PDF could not be read") from exc


def _from_docx(data: bytes) -> str:
    document = Document(io.BytesIO(data))
    return "\n\n".join(paragraph.text for paragraph in document.paragraphs)


def _from_plain_text(data: bytes) -> str:
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise BadRequestError("Text files must be UTF-8 encoded") from exc


EXTRACTORS = {
    ".pdf": _from_pdf,
    ".docx": _from_docx,
    ".txt": _from_plain_text,
    ".md": _from_plain_text,
}


def extract_text_from_file(filename: str, data: bytes) -> str:
    extension = PurePath(filename).suffix.lower()
    extractor = EXTRACTORS.get(extension)
    if extractor is None:
        supported = ", ".join(SUPPORTED_EXTENSIONS)
        raise BadRequestError(f"Unsupported file type. Supported: {supported}")
    text = extractor(data).strip()
    if not text:
        raise BadRequestError("No readable text found in the file")
    return text
