---
title: Overview
description: What the AI Knowledge Inbox does, how it is built, and where to read more.
order: 1
---

# AI Knowledge Inbox

My take-home for the Full Stack Developer role at Turium AI. The brief is in
`docs/Turium_AI_Interview_Assignment.pdf`.

## What it does

You save notes, links and files into **knowledge bases**, then ask questions
in a chat. Answers stream in with numbered citations, and each one is checked
against the sources before it is saved.

- A chat reads only the knowledge bases you tick when you start it.
- Tick none and it answers from general knowledge, labelled as such.
- There is no sign-in. The brief asks for a single user.

## How it is built

| Part | Choice |
| --- | --- |
| Frontend | Next.js 16, React 19, TanStack Query, Tailwind |
| Backend | FastAPI (Python 3.12) |
| Storage | Postgres 17 with pgvector, for both app data and vectors |
| AI | OpenAI or Gemini, picked by whichever key is set |

## Read next

| To… | Read |
| --- | --- |
| Run it on your machine | [Local setup](/docs/getting-started/local-setup) |
| Call the API | [API reference](/docs/reference/api) |
| Understand the choices | [Design decisions](/docs/reference/design-decisions) |
| See how answers are tested | [Evaluation](/docs/reference/evaluation) |
