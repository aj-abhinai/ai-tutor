**AI Tutor (NCERT Class 7)**
A Next.js app that helps Class 7 students learn NCERT Science and Maths using a simple Learn ? Listen ? Quiz flow with local curriculum data and Gemini-powered feedback.

**Features**
- Learn card with quick explanations, level-based bullet points, and a curiosity question.
- Listen card that reads the Learn content aloud using browser TTS.
- Quiz card with MCQ and short-answer questions from the local question bank.
- **Reaction Lab**: An interactive playground to mix chemicals and observe reactions (color change, gas, precipitate).
- Explain-it-back and quiz feedback powered by Gemini (with fallback checks for short answers).
- Deep explanation generator for extended reading (HTML-formatted sections).

**Tech Stack**
- Next.js App Router, React 19, TypeScript, Tailwind CSS.
- Gemini API via `@google/generative-ai` for expand, deep, and feedback routes.

**Getting Started**
1. Install dependencies: `npm install`.
1. Add environment variables (see below).
1. Run the dev server: `npm run dev`.
1. Open `http://localhost:3000`.

**Environment Variables**
- `GEMINI_API_KEY` is required for `/api/expand`, `/api/deep`, and `/api/feedback`.
- Create `.env.local` with `GEMINI_API_KEY=your_key_here`.

**Scripts**
- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run start` runs the production server.
- `npm run lint` runs ESLint.
- `npm run test` runs Jest.

**Project Structure**
- `app/` contains the UI and API routes.
- `components/` contains UI components and card layouts.
- `lib/curriculum/` contains the NCERT-aligned curriculum, topics, subtopics, and question bank.
- `__tests__/` contains Jest tests.

**API Routes**
- `POST /api/explain` returns the base lesson content for a selected subtopic.
- `POST /api/expand` returns an expanded explanation with analogy and misconceptions.
- `POST /api/deep` returns a long-form, structured explanation.
- `POST /api/feedback` returns feedback for explain-it-back and quiz answers.
- `POST /api/lab` returns reaction results and a simplified AI explanation for a given pair of chemicals.