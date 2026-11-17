"""Parent-child chunking.

Child chunks (~400 chars) are small enough that one embedding captures one idea,
which keeps retrieval precise. Their parent (~2000 chars) is what the LLM reads,
so an answer never sees a sentence cut off from its surrounding paragraph.
"""

import re
from dataclasses import dataclass

PARENT_MAX_CHARS = 2000
CHILD_MAX_CHARS = 400
CHILD_OVERLAP_CHARS = 80
SEPARATORS = ("\n\n", "\n", ". ", " ")


@dataclass(frozen=True)
class ParentDraft:
    content: str
    children: list[str]


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _split_recursively(
    text: str, max_chars: int, separators: tuple[str, ...]
) -> list[str]:
    if len(text) <= max_chars:
        return [text]
    for index, separator in enumerate(separators):
        if separator not in text:
            continue
        parts = text.split(separator)
        pieces = [part + separator for part in parts[:-1]] + [parts[-1]]
        result: list[str] = []
        for piece in pieces:
            if len(piece) > max_chars:
                result += _split_recursively(piece, max_chars, separators[index + 1 :])
            elif piece.strip():
                result.append(piece)
        return result
    return [text[start : start + max_chars] for start in range(0, len(text), max_chars)]


def _tail(text: str, max_chars: int) -> str:
    if max_chars == 0 or len(text) <= max_chars:
        return text if max_chars else ""
    tail = text[-max_chars:]
    boundary = tail.find(" ")
    return tail[boundary + 1 :] if boundary != -1 else tail


def _merge(pieces: list[str], max_chars: int, overlap: int) -> list[str]:
    chunks: list[str] = []
    current = ""
    for piece in pieces:
        if current and len(current) + len(piece) > max_chars:
            chunks.append(current.strip())
            current = _tail(current, overlap)
        current += piece
    if current.strip():
        chunks.append(current.strip())
    return chunks


def split_text(text: str, max_chars: int, overlap: int = 0) -> list[str]:
    pieces = _split_recursively(text, max_chars, SEPARATORS)
    return _merge(pieces, max_chars, overlap)


def chunk_document(text: str) -> list[ParentDraft]:
    parents = split_text(normalize_text(text), PARENT_MAX_CHARS)
    return [
        ParentDraft(
            content=parent,
            children=split_text(parent, CHILD_MAX_CHARS, CHILD_OVERLAP_CHARS),
        )
        for parent in parents
    ]
