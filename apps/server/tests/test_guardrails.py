from app.services.rag.guardrails import check_citations, is_no_answer
from app.services.rag.prompts import NO_ANSWER


def test_valid_citations_are_kept():
    check = check_citations("Fridays are frozen [1]. So is month end [2].", 2)

    assert check.answer == "Fridays are frozen [1]. So is month end [2]."
    assert check.cited_numbers == {1, 2}
    assert check.invalid_numbers == []


def test_citations_to_missing_sources_are_removed():
    check = check_citations("Frozen on Fridays [1][4]. Also [7].", 2)

    assert check.answer == "Frozen on Fridays [1]. Also ."
    assert check.cited_numbers == {1}
    assert check.invalid_numbers == [4, 7]


def test_no_answer_detection_ignores_trailing_punctuation():
    assert is_no_answer(NO_ANSWER)
    assert is_no_answer(NO_ANSWER.rstrip(".") + "\n")
    assert not is_no_answer("Deploys are frozen on Fridays [1].")
