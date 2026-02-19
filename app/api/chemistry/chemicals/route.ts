import { NextResponse } from "next/server";
import { getChemicalsFromFirestore } from "@/lib/firestore-lab";

export async function GET() {
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
