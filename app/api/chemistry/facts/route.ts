import { NextRequest, NextResponse } from "next/server";
import { getChemicalFactsFromFirestore } from "@/lib/firestore-lab";
import { getRequestUserId } from "@/lib/api/shared";

export async function GET(request: NextRequest) {
    const userId = await getRequestUserId(request);
    if (!userId) {
        return NextResponse.json({ error: "Student login required." }, { status: 401 });
    }
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
