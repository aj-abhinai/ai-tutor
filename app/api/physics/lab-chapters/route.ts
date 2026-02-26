import { NextRequest, NextResponse } from "next/server";
import { getPhysicsLabChapterIdsFromFirestore } from "@/lib/physics/firestore";

export async function GET(request: NextRequest) {
  try {
    const chapterIds = await getPhysicsLabChapterIdsFromFirestore();
    return NextResponse.json({ chapterIds });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    const payload =
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to load physics lab chapters", details }
        : { error: "Failed to load physics lab chapters" };
    return NextResponse.json(payload, { status: 500 });
  }
}
