import type { SubjectName } from "@/lib/learning-types";

export interface TopicImage {
  id: string;
  subject: SubjectName;
  chapterId: string;
  topicId: string;
  subtopicId?: string;
  title: string;
  imageUrl: string;
  caption?: string;
  type: "comic" | "diagram" | "illustration";
  createdAt: number;
  updatedAt: number;
}

export interface TopicImageSummary {
  id: string;
  subject: SubjectName;
  chapterId: string;
  topicId: string;
  subtopicId?: string;
  title: string;
  imageUrl: string;
  caption?: string;
  type: "comic" | "diagram" | "illustration";
}

export type CreateTopicImageArgs = Omit<TopicImage, "id" | "createdAt" | "updatedAt">;
export type UpdateTopicImageArgs = Partial<Omit<TopicImage, "id" | "createdAt" | "updatedAt">>;
