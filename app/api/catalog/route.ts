import { NextRequest, NextResponse } from "next/server";
import { getCatalogFromDB } from "@/lib/rag";
import { isValidSubject } from "@/lib/api/shared";

export async function GET(request: NextRequest) {
  const subject = request.nextUrl.searchParams.get("subject");
  if (!subject || !isValidSubject(subject)) {
    return NextResponse.json(
      { error: "Subject query param must be Science or Maths" },
      { status: 400 }
    );
  }

  try {
    const catalog = await getCatalogFromDB(subject);
    return NextResponse.json({ catalog });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to load catalog", details }
        : { error: "Failed to load catalog" },
      { status: 500 }
    );
  }
}

