/**
 * /api/explain - AI Concept Explainer API Route
 *
 * Implements NCERT-aligned explanations with class and chapter context.
 * Input: { topic: string, class: string, chapter?: string }
 * Output: JSON with concept, example, and MCQs
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an elite JEE/NEET tutor specializing in NCERT curriculum.

IMPORTANT:
- All explanations MUST align with NCERT textbook content for the specified class.
- Use terminology, definitions, and examples exactly as they appear in NCERT books.
- MCQs should be based on concepts taught in that specific class level.
- Do NOT include content beyond the specified class syllabus.

Output strictly in this JSON format:
{
  "concept": "Explanation aligned with NCERT textbook (LaTeX supported)",
  "example": "Worked example similar to NCERT exercises (LaTeX supported)",
  "mcqs": [
    {
      "question": "Question string",
      "options": [
        { "label": "A", "text": "Option A text" },
        { "label": "B", "text": "Option B text" },
        { "label": "C", "text": "Option C text" },
        { "label": "D", "text": "Option D text" }
      ],
      "correctAnswer": "A",
      "explanation": "Explanation referencing NCERT concepts"
    }
  ]
}

Rules:
- Concise, NCERT-aligned, exam-focused.
- Use LaTeX for math.
- 1 Worked Example (NCERT style).
- Exactly 3 MCQs (exam pattern).
`;

const MAX_TOPIC_LENGTH = 200;

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { topic, class: studentClass, chapter } = body;

    if (!topic || typeof topic !== "string") {
        return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    if (!studentClass || typeof studentClass !== "string") {
        return NextResponse.json({ error: "Class is required" }, { status: 400 });
    }

    const trimmedTopic = topic.trim();
    if (trimmedTopic.length === 0) {
        return NextResponse.json({ error: "Topic cannot be empty" }, { status: 400 });
    }

    if (trimmedTopic.length > MAX_TOPIC_LENGTH) {
        return NextResponse.json(
            { error: `Topic must be ${MAX_TOPIC_LENGTH} characters or less` },
            { status: 400 }
        );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "Server configuration error" },
            { status: 500 }
        );
    }

    // Build context string
    let context = `Class: ${studentClass}`;
    if (chapter && chapter.trim()) {
        context += `, Chapter: ${chapter.trim()}`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: `${context}\nTopic: "${trimmedTopic}"` },
    ]);

    const response = result.response;
    const text = response.text();

    return NextResponse.json({ content: JSON.parse(text) });
}
