/**
 * /api/explain - AI Concept Explainer API Route
 *
 * Implements the prompt template from agent.md Section 5.
 * Input: { topic: string }
 * Output: Markdown with 4 sections (Concept Breakdown, Worked Example, Practice MCQs, Why Wrong Options Fail)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an elite JEE/NEET tutor.

Rules:
- Explain step-by-step from first principles
- Use simple language, no fluff
- Assume the student is average, not brilliant
- Anticipate confusion and clarify it explicitly
- Include ONE worked numerical example
- Generate exactly 3 MCQs
- For each wrong option, explain why it is wrong
- Use LaTeX for equations (wrap in $ for inline, $$ for block)
- Do not include any content outside the structure below

Output strictly in this format:

## Concept Breakdown

## Worked Example

## Practice MCQs

## Why Wrong Options Fail`;

const MAX_TOPIC_LENGTH = 200;

export async function POST(request: NextRequest) {
    const { topic } = await request.json();

    // Reject empty input
    if (!topic || typeof topic !== "string") {
        return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Reject whitespace-only input
    const trimmedTopic = topic.trim();
    if (trimmedTopic.length === 0) {
        return NextResponse.json({ error: "Topic cannot be empty" }, { status: 400 });
    }

    // Limit topic length
    if (trimmedTopic.length > MAX_TOPIC_LENGTH) {
        return NextResponse.json(
            { error: `Topic must be ${MAX_TOPIC_LENGTH} characters or less` },
            { status: 400 }
        );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        // Generic error - do not expose API key configuration details
        return NextResponse.json(
            { error: "Server configuration error" },
            { status: 500 }
        );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: `Explain the topic: "${topic}"` },
    ]);

    const response = result.response;
    const text = response.text();

    return NextResponse.json({ content: text });
}
