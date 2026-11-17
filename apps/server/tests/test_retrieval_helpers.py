import uuid

from app.services.retrieval import RRF_K, build_keyword_query, reciprocal_rank_fusion


def test_keyword_query_ors_unique_words_and_drops_punctuation():
    assert build_keyword_query("Who owns Falcon? Falcon's on-call!") == (
        "who | owns | falcon | on | call"
    )


def test_keyword_query_is_empty_without_words():
    assert build_keyword_query("?? !!") == ""


def test_rrf_rewards_chunks_found_by_both_methods():
    parent = uuid.uuid4()
    both, vector_only, keyword_only = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()

    hits = reciprocal_rank_fusion(
        [(vector_only, parent, "v"), (both, parent, "b")],
        [(keyword_only, parent, "k"), (both, parent, "b")],
    )

    assert hits[both].score == 2 / (RRF_K + 2)
    assert hits[both].score > hits[vector_only].score
    assert hits[both].score > hits[keyword_only].score
