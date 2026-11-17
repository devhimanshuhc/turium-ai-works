---
title: Evaluation
description: How retrieval, answer correctness, faithfulness and refusals are measured offline.
order: 3
---

# Evaluation

```bash
pnpm --filter server eval
```

This runs the **real** pipeline with your API key. It loads four short documents
from `apps/server/evals/corpus/` into a temporary knowledge base, asks 14
questions, scores the answers, saves a report to `apps/server/evals/reports/`,
and then deletes everything it created.

## The questions

| Kind | Count | What it checks |
| --- | --- | --- |
| Facts from one document | 9 | Basic search and answering. Some use exact terms like `STRIPE_TEST_KEY` to test full-text search. |
| Facts across two documents | 1 | Combining sources |
| Not in the documents | 3 | Saying "not found" instead of guessing, including one question the model knows the answer to but the documents don't cover |

## What is measured

| Metric | Meaning |
| --- | --- |
| Retrieval hit rate, MRR | Did search find the right document, and how high did it rank? |
| Correctness | A model grades each answer 1–5 against a written reference. 4 or more counts as correct. |
| Faithfulness | The app's own answer check: is every claim backed by a source? |
| Refusal accuracy | Questions with no answer in the documents get "not found". |
| False refusals | Questions that do have an answer wrongly get "not found". |
| Latency | Time per question, median and worst |

A question passes if it's answered correctly, or correctly refused.

## Latest results

Gemini on Vertex AI, with `gemini-3.1-pro-preview` answering:

| Metric | Run 1 | Run 2 |
| --- | --- | --- |
| Pass rate | 13/14 | **14/14** |
| Retrieval hit rate / MRR | 91% / 91% | 100% / 100% |
| Correctness (mean score) | 4.9 | 5.0 |
| Faithfulness | 100% | 100% |
| Refusal accuracy | 3/3 | 3/3 |
| False refusals | 0 | 0 |
| Latency median / worst | 6.5 s / 41 s | 5.2 s / 7.1 s |

**Why run 1 failed once:** Gemini returned a rate-limit error after the answer
had started streaming, which the retry didn't cover. The fix retries, and falls
back to the faster model, as long as no text has been sent yet. It lives in
`app/clients/llm/gemini.py` and is tested in `tests/test_gemini_llm.py`.

## Limits

- 14 questions is a smoke test. It catches regressions, but it doesn't prove
  quality on large, messy documents.
- The same model family answers and grades, which can flatter the scores. A
  grader from another provider would be fairer.
- Search is scored per document, not per chunk.

Related: [Design decisions](/docs/reference/design-decisions) · [API reference](/docs/reference/api)
