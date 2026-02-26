import type { SubjectName } from "@/lib/learning-types";

export interface ExploreCitation {
  chunkId: string;
  lane: "facts" | "activities";
  score: number;
  heading: string;
  textPreview: string;
}

export interface ExploreMessage {
  id: string;
  question: string;
  answer: string;
  citations: ExploreCitation[];
  timestamp: number;
}

export interface ExploreQueryPayload {
  subject: SubjectName;
  chapterId: string;
  topicId: string;
  subtopicId: string;
  question: string;
  topK?: number;
  lane?: "facts" | "activities" | "both";
}

export interface ExploreResult {
  answer: string;
  citations: ExploreCitation[];
}

export interface UseExploreOptions {
  subject: SubjectName;
  chapterId: string;
  topicId: string;
  subtopicId: string;
  requireLoginFor: (action: string) => boolean;
}

export interface UseExploreReturn {
  messages: ExploreMessage[];
  isLoading: boolean;
  error: string;
  askQuestion: (question: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}
