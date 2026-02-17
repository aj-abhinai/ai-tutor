/**
 * Seeding Tool: Pushes a single test subtopic (closed-open-circuits) to Firestore.
 * Run with: npx tsx scripts/seed-one-doc.ts
 *
 * Usage: npx tsx scripts/seed-one-doc.ts
 *
 * Requires service-account.json in project root or
 * GOOGLE_APPLICATION_CREDENTIALS env var set.
 */

import { getFirestoreClient } from "../lib/firebase-admin";

const doc = {
    subject: "Science",
    chapterId: "electricity-circuits",
    topicId: "circuits-and-switches",
    subtopicId: "closed-open-circuits",
    content: {
        id: "closed-open-circuits",
        title: "Closed and Open Circuits",
        learningObjectives: [
            "Define closed and open circuits",
            "Explain why a bulb glows only in a closed circuit",
            "Identify breaks that make a circuit open",
        ],
        keyConcepts: [
            "A circuit is a complete path for current",
            "A closed circuit lets current flow",
            "An open circuit breaks the path",
        ],
        keyTerms: {
            Circuit: "A complete path for electric current",
            "Closed circuit": "A complete, unbroken path",
            "Open circuit": "A broken path where current cannot flow",
        },
        examples: [
            "A torch glows when its switch is ON",
            "A doorbell works only when the circuit is complete",
        ],
        misconceptions: [
            "A bulb can glow even if the circuit has a break",
        ],
        questionBank: [
            {
                id: "closed-open-q1",
                question: "A bulb glows only when the circuit is",
                type: "mcq",
                options: [
                    { label: "A", text: "open" },
                    { label: "B", text: "closed" },
                    { label: "C", text: "broken" },
                    { label: "D", text: "without wires" },
                ],
                answer: { correct: "B", explanation: "Current flows only in a closed circuit." },
            },
            {
                id: "closed-open-q2",
                question: "Which action makes a circuit open?",
                type: "mcq",
                options: [
                    { label: "A", text: "Connecting the switch" },
                    { label: "B", text: "Removing a wire" },
                    { label: "C", text: "Using a battery" },
                    { label: "D", text: "Using a bulb" },
                ],
                answer: { correct: "B", explanation: "Removing a wire breaks the path." },
            },
            {
                id: "closed-open-q3",
                question: "A switch in OFF position makes the circuit",
                type: "mcq",
                options: [
                    { label: "A", text: "closed" },
                    { label: "B", text: "open" },
                    { label: "C", text: "brighter" },
                    { label: "D", text: "faster" },
                ],
                answer: { correct: "B", explanation: "OFF means the circuit is open." },
            },
            {
                id: "closed-open-q4",
                question: "What is a closed circuit?",
                type: "short",
                answer: { correct: "A complete, unbroken path for current to flow.", explanation: "Current needs a complete loop to move." },
            },
            {
                id: "closed-open-q5",
                question: "What is an open circuit?",
                type: "short",
                answer: { correct: "A broken path where current cannot flow.", explanation: "A gap stops the flow of current." },
            },
            {
                id: "closed-open-q6",
                question: "Why does a bulb stop glowing when the circuit is open?",
                type: "reasoning",
                answer: { correct: "The path breaks so current cannot reach the bulb.", explanation: "No current means no glow." },
            },
        ],
    },
    createdAt: new Date(),
};

async function seed() {
    const db = getFirestoreClient();
    const ref = db.collection("curriculum_chunks").doc("seed-closed-open-circuits");
    await ref.set(doc);
    console.log("✅ Seeded: curriculum_chunks/seed-closed-open-circuits");
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
});
