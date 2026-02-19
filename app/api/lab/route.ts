/**
 * /api/lab - Chemistry Reaction API
 *
 * Returns reaction data + richer AI explanation (concept, why it happens, real-life example).
 * Chemistry facts are resolved from Firestore reaction data; AI only enriches explanation text.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import type { Reaction } from "@/lib/reactions";
import { getReactionsFromFirestore } from "@/lib/firestore-lab";
import { findExampleReactionForChemical, findReaction } from "@/lib/reaction-engine";
import {
    createRateLimiter,
    getRateLimitKey,
    isNonEmptyString,
} from "@/lib/api/shared";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 15;
const MAX_CHEMICAL_LENGTH = 200;
const isRateLimited = createRateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);

const LAB_EXPLANATION_PROMPT = `You are a friendly Class 7 science tutor helping a student aged 10-14.

A student just mixed two chemicals in a virtual lab. Explain the result in JSON.

Rules:
- Use simple, short sentences (max 15 words each)
- Stay within NCERT Class 7 scope
- Do NOT add chemicals, products, or equations not in the fixed summary
- Return ONLY valid JSON, no markdown, no code fences

Return this exact shape:
{
  "concept": "2-4 word concept name (e.g. Acid-Base Neutralization)",
  "explanation": "2-3 sentences describing what happened in plain language",
  "whyItHappens": "1-2 sentences explaining the scientific reason simply",
  "realLifeExample": "One sentence: where does this appear in daily life?"
}`;

export interface LabAIResponse {
    concept: string;
    explanation: string;
    whyItHappens: string;
    realLifeExample: string;
}

function buildReactionFactsSummary(reaction: Reaction): string {
    const observations = [
        reaction.visual.color ? "a visible colour change is observed" : "",
        reaction.visual.gas ? "gas bubbles are produced" : "",
        reaction.visual.heat === "exothermic" ? "heat is released" : "",
        reaction.visual.heat === "endothermic" ? "heat is absorbed" : "",
        reaction.visual.precipitate ? "a solid precipitate forms" : "",
    ]
        .filter(Boolean)
        .join(", ");

    return [
        `${reaction.reactantA} reacts with ${reaction.reactantB}.`,
        `This is a ${reaction.category} reaction.`,
        `Equation: ${reaction.equation}.`,
        `Products: ${reaction.products}.`,
        observations ? `Lab observation: ${observations}.` : "No dramatic visible change.",
    ].join(" ");
}

function buildNoReactionSummary(chemicalA: string, chemicalB: string, reactions: Reaction[]): string {
    const example = findExampleReactionForChemical(chemicalA, chemicalB, reactions);
    const base = `${chemicalA} and ${chemicalB} do not react under normal class-lab conditions.`;
    return example
        ? `${base} However, ${chemicalA} does react in another setup: ${example.reactantA} + ${example.reactantB} -> ${example.products}.`
        : `${base} This pair is not chemically compatible in our lab.`;
}

function buildFallbackResponse(reaction: Reaction | null, chemA: string, chemB: string): LabAIResponse {
    if (reaction) {
        return {
            concept: reaction.category,
            explanation: `${reaction.reactantA} reacts with ${reaction.reactantB} to form ${reaction.products}.`,
            whyItHappens: `This is a ${reaction.category} reaction. Equation: ${reaction.equation}.`,
            realLifeExample: "This type of reaction happens in many everyday chemical processes.",
        };
    }
    return {
        concept: "No Reaction",
        explanation: `${chemA} and ${chemB} do not react under normal lab conditions.`,
        whyItHappens: "These two substances are not chemically compatible at room temperature.",
        realLifeExample: "Not every chemical pair reacts - compatibility depends on reactivity.",
    };
}

function parseSafeJSON(text: string): LabAIResponse | null {
    const cleaned = text.replace(/```json|```/g, "").trim();
    try {
        const parsed = JSON.parse(cleaned);
        if (
            typeof parsed.concept === "string" &&
            typeof parsed.explanation === "string" &&
            typeof parsed.whyItHappens === "string" &&
            typeof parsed.realLifeExample === "string"
        ) {
            return parsed as LabAIResponse;
        }
        return null;
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    const clientKey = getRateLimitKey(request);
    if (await isRateLimited(clientKey)) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Please try again shortly." },
            { status: 429 }
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { chemicalA, chemicalB } = body as { chemicalA?: unknown; chemicalB?: unknown };

    if (!isNonEmptyString(chemicalA)) {
        return NextResponse.json({ error: "Chemical A is required" }, { status: 400 });
    }
    if (!isNonEmptyString(chemicalB)) {
        return NextResponse.json({ error: "Chemical B is required" }, { status: 400 });
    }

    const left = chemicalA.trim();
    const right = chemicalB.trim();

    if (left.length > MAX_CHEMICAL_LENGTH || right.length > MAX_CHEMICAL_LENGTH) {
        return NextResponse.json(
            { error: `Chemical names must be ${MAX_CHEMICAL_LENGTH} characters or less` },
            { status: 400 }
        );
    }
    if (left === right) {
        return NextResponse.json({ error: "Please choose two different chemicals" }, { status: 400 });
    }

    let reactions: Reaction[] = [];
    try {
        reactions = await getReactionsFromFirestore();
    } catch (err) {
        console.error("Failed to load chemistry reactions from Firestore:", err);
    }

    const reaction = findReaction(left, right, reactions);
    const factsSummary = reaction
        ? buildReactionFactsSummary(reaction)
        : buildNoReactionSummary(left, right, reactions);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({
            reaction: reaction ?? null,
            ...buildFallbackResponse(reaction, left, right),
        });
    }

    let aiResponse = buildFallbackResponse(reaction, left, right);
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent([
            { text: LAB_EXPLANATION_PROMPT },
            { text: `Fixed chemistry summary:\n${factsSummary}` },
        ]);
        const parsed = parseSafeJSON(result.response.text());
        if (parsed) aiResponse = parsed;
    } catch (err) {
        console.error("Gemini lab explanation failed:", err);
    }

    return NextResponse.json({
        reaction: reaction ?? null,
        ...aiResponse,
    });
}
