import { NextRequest, NextResponse } from "next/server";
import { getPhysicsLabChapterIdsFromFirestore } from "@/lib/firestore-lab";
import { getRequestUserId } from "@/lib/api/shared";

export async function GET(request: NextRequest) {
    const userId = await getRequestUserId(request);
    if (!userId) {
        return NextResponse.json({ error: "Student login required." }, { status: 401 });
    }
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

