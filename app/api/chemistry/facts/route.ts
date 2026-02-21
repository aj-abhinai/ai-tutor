import { NextResponse } from "next/server";
import { getChemicalFactsFromFirestore } from "@/lib/firestore-lab";

export async function GET() {
    try {
        const facts = await getChemicalFactsFromFirestore();
        return NextResponse.json({ facts });
    } catch (err) {
        const details = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
            process.env.NODE_ENV !== "production"
                ? { error: "Failed to load chemistry facts", details }
                : { error: "Failed to load chemistry facts" },
            { status: 500 }
        );
    }
}

