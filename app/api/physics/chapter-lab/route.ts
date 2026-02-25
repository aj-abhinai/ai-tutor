import { NextRequest, NextResponse } from "next/server";
import { getPhysicsChapterLabFromFirestore } from "@/lib/physics/firestore";
import { getRequestUserId } from "@/lib/api/shared";

const MAX_CHAPTER_ID_LENGTH = 120;

export async function GET(request: NextRequest) {
    const userId = await getRequestUserId(request);
    if (!userId) {
        return NextResponse.json({ error: "Student login required." }, { status: 401 });
    }
    const chapterId = request.nextUrl.searchParams.get("chapterId")?.trim() ?? "";

    if (!chapterId) {
        return NextResponse.json(
            { error: "chapterId query parameter is required" },
            { status: 400 }
        );
    }

    if (chapterId.length > MAX_CHAPTER_ID_LENGTH) {
        return NextResponse.json(
            { error: `chapterId must be ${MAX_CHAPTER_ID_LENGTH} characters or less` },
            { status: 400 }
        );
    }

    try {
        const chapterLab = await getPhysicsChapterLabFromFirestore(chapterId);
        if (chapterLab) {
            return NextResponse.json({ chapterLab, source: "firestore" });
        }
        return NextResponse.json(
            { error: "No physics lab is available for this chapter" },
            { status: 404 }
        );
    } catch (firestoreError) {
        const details =
            firestoreError instanceof Error
                ? firestoreError.message
                : String(firestoreError);
        return NextResponse.json(
            process.env.NODE_ENV !== "production"
                ? { error: "Failed to load physics chapter lab", details }
                : { error: "Failed to load physics chapter lab" },
            { status: 500 }
        );
    }
}
