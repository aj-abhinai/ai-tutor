"server-only";

import { getFirestoreClient } from "@/lib/firebase-admin";
import type { StudentProgress, UnitTestResult } from "@/lib/profile-types";

// Firestore progress operations for student progress tracking
const PROGRESS_COLLECTION = "student_progress";

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// Get student progress from Firestore
export async function getStudentProgress(
  userId: string
): Promise<StudentProgress | null> {
  const db = getFirestoreClient();
  const doc = await db.collection(PROGRESS_COLLECTION).doc(userId).get();
  if (!doc.exists) return null;
  return doc.data() as StudentProgress;
}

// Ensure progress doc exists, create if not
export async function ensureStudentProgress(
  userId: string
): Promise<StudentProgress> {
  const db = getFirestoreClient();
  const ref = db.collection(PROGRESS_COLLECTION).doc(userId);
  const doc = await ref.get();

  if (doc.exists) {
    return doc.data() as StudentProgress;
  }

  const now = Date.now();
  const progress: StudentProgress = {
    uid: userId,
    completedUnitTests: [],
    totalCompleted: 0,
    streakDays: 0,
    lastCompletedDate: null,
    createdAtMs: now,
    updatedAtMs: now,
  };

  await ref.set(progress);
  return progress;
}

// Record a unit test completion, update streak
export async function recordUnitTestCompletion(
  userId: string,
  testId: string,
  testTitle: string,
  chapterId: string,
  chapterTitle: string,
  score?: number
): Promise<StudentProgress> {
  const db = getFirestoreClient();
  const ref = db.collection(PROGRESS_COLLECTION).doc(userId);
  const now = Date.now();
  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  const doc = await ref.get();
  let progress: StudentProgress;

  if (!doc.exists) {
    progress = {
      uid: userId,
      completedUnitTests: [],
      totalCompleted: 0,
      streakDays: 0,
      lastCompletedDate: null,
      createdAtMs: now,
      updatedAtMs: now,
    };
  } else {
    progress = doc.data() as StudentProgress;
  }

  const alreadyCompleted = progress.completedUnitTests.some(
    (t) => t.testId === testId
  );
  if (alreadyCompleted) {
    return progress;
  }

  const newResult: UnitTestResult = {
    testId,
    testTitle,
    chapterId,
    chapterTitle,
    completedAt: now,
    score,
  };

  let newStreak = progress.streakDays;
  if (progress.lastCompletedDate === null) {
    newStreak = 1;
  } else if (progress.lastCompletedDate === today) {
    // Already completed today, streak stays same
  } else if (progress.lastCompletedDate === yesterday) {
    // Completed yesterday, increment streak
    newStreak = progress.streakDays + 1;
  } else {
    // Streak broken, start new
    newStreak = 1;
  }

  const updatedProgress: StudentProgress = {
    ...progress,
    completedUnitTests: [newResult, ...progress.completedUnitTests].slice(0, 50),
    totalCompleted: progress.totalCompleted + 1,
    streakDays: newStreak,
    lastCompletedDate: today,
    updatedAtMs: now,
  };

  await ref.set(updatedProgress);
  return updatedProgress;
}
