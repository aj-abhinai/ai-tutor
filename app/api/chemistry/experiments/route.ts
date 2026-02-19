import { NextResponse } from "next/server";
import { getExperimentsFromFirestore } from "@/lib/firestore-lab";

export async function GET() {
    try {
        const experiments = await getExperimentsFromFirestore();
        return NextResponse.json({ experiments });
    } catch (err) {
        const details = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
            process.env.NODE_ENV !== "production"
                ? { error: "Failed to load chemistry experiments", details }
                : { error: "Failed to load chemistry experiments" },
            { status: 500 }
        );
    }
}
