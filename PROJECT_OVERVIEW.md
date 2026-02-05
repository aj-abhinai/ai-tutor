# Project Overview: AI Tutor (NCERT Class 7)

## Why This Project
Class 7 students need fast, clear explanations and immediate feedback while staying strictly within NCERT scope. General-purpose tutors are often too broad, too advanced, or inconsistent in tone, which creates confusion and reduces confidence.

## Design Principles
1. One concept at a time to reduce cognitive load.
1. Short, encouraging language for 12-year-old readers.
1. Strict NCERT boundaries to prevent off-syllabus drift.
1. Consistent output structure so the UI stays predictable.
1. Practice immediately after learning to reinforce memory.

## Experience Flow (Learn -> Listen -> Quiz)
The flow is intentionally simple:
1. Learn: a short explanation plus level-based bullets so students can choose depth.
1. Listen: browser TTS for students who learn better by hearing or need accessibility support.
1. Quiz: immediate recall checks to lock in understanding and surface gaps.

This keeps the interaction focused and avoids overwhelming students with long pages.

## Key Decisions and Rationale
- Local curriculum and question bank: ensures accuracy, scope control, and predictable coverage.
- Structured AI response shapes: keeps content consistent and prevents UI breakage.
- Explain-it-back feedback: encourages active recall and helps students self-correct.
- Short, friendly tone rules: reduces anxiety and keeps students engaged.
- Single-page flow: minimizes navigation overhead and keeps attention on the topic.

## What Success Looks Like
Students can understand a topic in minutes, explain it back in their own words, and get gentle, specific feedback. Teachers or parents can trust the content stays within NCERT Class 7.

## Out of Scope (V1)
- Multi-page navigation or accounts
- Progress tracking
- Non-NCERT content
- Malayalam output (planned)
- Server-side TTS

