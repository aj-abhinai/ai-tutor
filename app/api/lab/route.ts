/**
 * /api/lab - Reaction Playground API Route
 *
 * Rule: chemistry facts come only from the local reaction engine.
 * AI is used only to rephrase a fixed, deterministic explanation.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { type Reaction } from "@/lib/reactions";
import { findExampleReactionForChemical, findReaction } from "@/lib/reaction-engine";
import {
    createRateLimiter,
    getRateLimitKey,
    isNonEmptyString,
} from "@/lib/api/shared";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 15;
const MAX_CHEMICAL_LENGTH = 200;
const MAX_EXPLANATION_LENGTH = 700;
const isRateLimited = createRateLimiter(RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);

// The model can only rewrite the given summary, not add chemistry facts.
const EXPLANATION_REWRITE_PROMPT = `You are a friendly Class 7 science tutor.

Rewrite the provided summary in 3-5 short sentences.

Rules:
- Keep all chemistry facts exactly the same
- Do not add or remove any chemicals, products, equations, or reaction type
- Do not add new experiments, comparisons, or "reacts with" claims
- Use simple words for a 12-year-old
- Return plain text only (no markdown, no JSON)`;

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
        `The balanced equation is ${reaction.equation}.`,
        `The products are ${reaction.products}.`,
        observations ? `In the lab, ${observations}.` : "The observed change matches this reaction.",
    ].join(" ");
}

function buildNoReactionSummary(chemicalA: string, chemicalB: string): string {
    const example = findExampleReactionForChemical(chemicalA, chemicalB);
    if (example) {
        return [
            `${chemicalA} and ${chemicalB} do not react under normal class-lab conditions.`,
            "No clear product is formed in this pair.",
            `${chemicalA} does react in another known setup: ${example.reactantA} + ${example.reactantB} -> ${example.products}.`,
            "So, reaction depends on choosing a compatible pair of chemicals.",
        ].join(" ");
    }

    return [
        `${chemicalA} and ${chemicalB} do not react under normal class-lab conditions.`,
        "No clear product is formed in this pair.",
        "This means the pair is not a compatible reaction in our lab dataset.",
    ].join(" ");
}

function isSafeExplanation(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_EXPLANATION_LENGTH) return false;
    if (/```|<[^>]+>/.test(trimmed)) return false;
    if (/[{}\[\]]/.test(trimmed)) return false;
    return true;
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

    const { chemicalA, chemicalB } = body as {
        chemicalA?: unknown;
        chemicalB?: unknown;
    };

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

    // Chemistry outcome is always resolved by local engine.
    const reaction = findReaction(left, right);
    const deterministicSummary = reaction
        ? buildReactionFactsSummary(reaction)
        : buildNoReactionSummary(left, right);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({
            reaction: reaction ?? null,
            explanation: deterministicSummary,
        });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    let explanation = deterministicSummary;
    try {
        const result = await model.generateContent([
            { text: EXPLANATION_REWRITE_PROMPT },
            { text: `Fixed summary:\n${deterministicSummary}` },
        ]);
        const candidate = result.response.text().trim();
        if (isSafeExplanation(candidate)) {
            explanation = candidate;
        }
    } catch (err) {
        console.error("Gemini generateContent failed:", err);
        // Keep chemistry result available even if AI rewrite fails.
        explanation = deterministicSummary;
    }

    return NextResponse.json({
        reaction: reaction ?? null,
        explanation,
    });
}
