export type StudentProfile = {
  uid: string;
  email: string;
  name: string;
  createdAtMs: number;
  updatedAtMs: number;
};

export type ProfileView = {
  name: string;
  email: string;
};

export type UnitTestResult = {
  testId: string;
  testTitle: string;
  chapterId: string;
  chapterTitle: string;
  completedAt: number;
  score?: number;
};

export type StudentProgress = {
  uid: string;
  completedUnitTests: UnitTestResult[];
  totalCompleted: number;
  streakDays: number;
  lastCompletedDate: string | null;
  createdAtMs: number;
  updatedAtMs: number;
};

export type StudentProgressView = {
  totalCompleted: number;
  streakDays: number;
  completedUnitTests: UnitTestResult[];
};
