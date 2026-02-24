import { NextRequest, NextResponse } from "next/server";
import { getChemicalsFromFirestore } from "@/lib/firestore-lab";
import { getRequestUserId } from "@/lib/api/shared";

export async function GET(request: NextRequest) {
    const userId = await getRequestUserId(request);
    if (!userId) {
        return NextResponse.json({ error: "Student login required." }, { status: 401 });
    }
    try {
        const chemicals = await getChemicalsFromFirestore();
        return NextResponse.json({ chemicals });
    } catch (err) {
        const details = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
            process.env.NODE_ENV !== "production"
                ? { error: "Failed to load chemistry chemicals", details }
                : { error: "Failed to load chemistry chemicals" },
            { status: 500 }
        );
    }
}
