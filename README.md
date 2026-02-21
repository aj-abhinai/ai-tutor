# AI Tutor (NCERT Class 7)
**Project Overview:** [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)

A Next.js app that helps Class 7 students learn NCERT Science and Maths through a simple `Learn -> Listen -> Quiz` flow, with curriculum data served from Firestore and targeted Gemini-powered feedback.

## Features
- Learn card with structured explanation and level-based depth.
- Listen card with browser text-to-speech.
- Quiz card using `questionBank` from backend subtopic data.
- Explain-it-back and short-answer feedback via Gemini.
- Deep explanation generation via Gemini.
- Chemistry and Physics lab modules with deterministic simulation behavior.

## Current Architecture (V2)
- Runtime curriculum source: Firestore (`curriculum_chunks`).
- Catalog loading: `GET /api/catalog`.
- Lesson loading: `POST /api/explain` (returns `content` and selected `subtopic`).
- AI routes use DB-loaded subtopic context: `/api/expand`, `/api/deep`, `/api/feedback`.

## Tech Stack
- Next.js App Router, React 19, TypeScript, Tailwind CSS.
- Firestore Admin SDK for backend curriculum access.
- Gemini API via `@google/generative-ai`.

## Getting Started
1. Install dependencies: `npm install`
2. Set environment variables (see below).
3. Run development server: `npm run dev`
4. Open `http://localhost:3000`

## Environment Variables
- `GEMINI_API_KEY` for AI routes (`/api/expand`, `/api/deep`, `/api/feedback`)
- Firebase Admin credentials for Firestore access in API routes
- Optional (recommended): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` for shared rate limiting

## Scripts
- `npm run dev` start dev server
- `npm run build` create production build
- `npm run start` run production server
- `npm run lint` run ESLint
- `npm run test` run Jest tests

## API Routes
- `GET /api/catalog` return chapter/topic/subtopic catalog for a subject
- `POST /api/explain` return base lesson content + selected subtopic payload
- `POST /api/expand` return expanded explanation
- `POST /api/deep` return long-form deep explanation
- `POST /api/feedback` return explain-it-back and quiz feedback
- `POST /api/lab` return lab simulation result + simplified explanation
- `GET /api/physics/chapter-lab` return physics chapter lab data from Firestore
- `GET /api/physics/lab-chapters` return chapter IDs that currently have Physics Lab data

