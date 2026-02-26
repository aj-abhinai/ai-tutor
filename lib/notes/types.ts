import type { SubjectName } from "@/lib/learning-types";

export interface StudentTopicNote {
  id: string;
  userId: string;
  subject: SubjectName;
  chapterId: string;
  chapterTitle: string;
  topicId: string;
  topicTitle: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface StudentTopicNoteSummary {
  id: string;
  subject: SubjectName;
  chapterId: string;
  chapterTitle: string;
  topicId: string;
  topicTitle: string;
  contentPreview: string;
  updatedAt: number;
}

