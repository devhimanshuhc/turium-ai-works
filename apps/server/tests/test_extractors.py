import io

import pytest
from docx import Document

from app.core.errors import BadRequestError
from app.services.ingestion.extractors import extract_text_from_file


def test_markdown_and_text_are_decoded():
    assert extract_text_from_file("notes.MD", b"# Title\n\nBody") == "# Title\n\nBody"
    assert extract_text_from_file("notes.txt", b"plain") == "plain"


def test_docx_paragraphs_are_extracted():
    document = Document()
    document.add_paragraph("First paragraph")
    document.add_paragraph("Second paragraph")
    buffer = io.BytesIO()
    document.save(buffer)

    text = extract_text_from_file("doc.docx", buffer.getvalue())

    assert text == "First paragraph\n\nSecond paragraph"


@pytest.mark.parametrize(
    ("filename", "data", "message"),
    [
        ("virus.exe", b"MZ", "Unsupported file type"),
        ("empty.txt", b"   \n", "No readable text"),
        ("latin1.txt", "café".encode("latin-1"), "UTF-8"),
        ("broken.pdf", b"not a pdf", "PDF could not be read"),
    ],
)
def test_bad_files_are_rejected_with_a_clear_message(filename, data, message):
    with pytest.raises(BadRequestError, match=message):
        extract_text_from_file(filename, data)
