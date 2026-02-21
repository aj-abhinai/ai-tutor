import { NextResponse } from "next/server";
import { getPhysicsLabChapterIdsFromFirestore } from "@/lib/firestore-lab";

export async function GET() {
    try {
        const chapterIds = await getPhysicsLabChapterIdsFromFirestore();
        return NextResponse.json({ chapterIds });
    } catch (err) {
        const details = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
            process.env.NODE_ENV !== "production"
                ? { error: "Failed to load physics lab chapters", details }
                : { error: "Failed to load physics lab chapters" },
            { status: 500 }
        );
    }
}

