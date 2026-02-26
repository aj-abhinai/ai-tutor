"use client";

import type { StudentProgressView, UnitTestResult } from "@/lib/profile-types";

export type { StudentProgressView, UnitTestResult };

// Fetch progress from API
export async function getProgress(): Promise<StudentProgressView> {
  const { getAuthHeaders } = await import("@/lib/auth-client");
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/progress", {
    method: "GET",
    headers: authHeaders,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data?.error || "Failed to load progress");
  }

  return response.json();
}

// Submit test completion to API
export async function recordTestCompletion(
  testId: string,
  testTitle: string,
  chapterId: string,
  chapterTitle: string,
  score?: number
): Promise<StudentProgressView> {
  const { getAuthHeaders } = await import("@/lib/auth-client");
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/progress", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      testId,
      testTitle,
      chapterId,
      chapterTitle,
      score,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data?.error || "Failed to record progress");
  }

  return response.json();
}
