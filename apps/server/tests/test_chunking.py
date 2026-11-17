from itertools import pairwise

from app.services.ingestion.chunking import (
    CHILD_MAX_CHARS,
    CHILD_OVERLAP_CHARS,
    PARENT_MAX_CHARS,
    chunk_document,
    normalize_text,
    split_text,
)


def _paragraphs(
    count: int, sentence: str = "The quick brown fox jumps over the lazy dog. "
) -> str:
    return "\n\n".join(sentence * 8 for _ in range(count))


def test_normalize_collapses_whitespace_but_keeps_paragraphs():
    assert normalize_text("a  \t b\r\n\n\n\nc") == "a b\n\nc"


def test_short_text_is_a_single_parent_with_a_single_child():
    parents = chunk_document("Just one short note.")

    assert len(parents) == 1
    assert parents[0].children == ["Just one short note."]


def test_parents_and_children_respect_size_limits():
    parents = chunk_document(_paragraphs(20))

    assert len(parents) > 1
    for parent in parents:
        assert len(parent.content) <= PARENT_MAX_CHARS
        for child in parent.children:
            assert len(child) <= CHILD_MAX_CHARS + CHILD_OVERLAP_CHARS


def test_children_cover_the_whole_parent():
    parent = chunk_document(_paragraphs(3))[0]

    for word in set(parent.content.split()):
        assert any(word in child for child in parent.children)


def test_consecutive_children_overlap():
    children = split_text(_paragraphs(4), CHILD_MAX_CHARS, CHILD_OVERLAP_CHARS)

    for previous, current in pairwise(children):
        assert previous[-20:].split()[-1] in current


def test_unbreakable_text_is_hard_split():
    chunks = split_text("x" * 1000, max_chars=300)

    assert [len(chunk) for chunk in chunks] == [300, 300, 300, 100]
