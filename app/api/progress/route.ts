/**
 * /api/progress - Student Progress API Route
 *
 * GET: Fetch user progress
 * POST: Record unit test completion
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUserId, createRateLimiter } from "@/lib/api/shared";
import {
  getStudentProgress,
  ensureStudentProgress,
  recordUnitTestCompletion,
} from "@/lib/progress/firestore";
import type { StudentProgressView } from "@/lib/profile-types";

// Rate limiter: 30 requests per minute
const rateLimiter = createRateLimiter(60 * 1000, 30);

const RecordCompletionSchema = z.object({
  testId: z.string().trim().min(1).max(100),
  testTitle: z.string().trim().min(1).max(200),
  chapterId: z.string().trim().min(1).max(100),
  chapterTitle: z.string().trim().min(1).max(200),
  score: z.number().min(0).max(100).optional(),
});

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private",
};

// GET /api/progress - fetch user progress
export async function GET(request: NextRequest) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Login required" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const progress = await getStudentProgress(userId);

    if (!progress) {
      const emptyProgress: StudentProgressView = {
        totalCompleted: 0,
        streakDays: 0,
        completedUnitTests: [],
      };
      return NextResponse.json(emptyProgress, { headers: NO_STORE_HEADERS });
    }

    const view: StudentProgressView = {
      totalCompleted: progress.totalCompleted,
      streakDays: progress.streakDays,
      completedUnitTests: progress.completedUnitTests,
    };

    return NextResponse.json(view, { headers: NO_STORE_HEADERS });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to load progress", details },
      { status: 500 }
    );
  }
}

// POST /api/progress - record test completion
export async function POST(request: NextRequest) {
  const userId = await getRequestUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Login required" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  if (await rateLimiter(`progress:${userId}`)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const body = await request.json();
    const parsed = RecordCompletionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { testId, testTitle, chapterId, chapterTitle, score } = parsed.data;

    const progress = await recordUnitTestCompletion(
      userId,
      testId,
      testTitle,
      chapterId,
      chapterTitle,
      score
    );

    const view: StudentProgressView = {
      totalCompleted: progress.totalCompleted,
      streakDays: progress.streakDays,
      completedUnitTests: progress.completedUnitTests,
    };

    return NextResponse.json(view, { headers: NO_STORE_HEADERS });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to record progress", details },
      { status: 500 }
    );
  }
}
