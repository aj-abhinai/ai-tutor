import type { SubjectName } from "@/lib/learning-types";
import type { StudentTopicNote, StudentTopicNoteSummary } from "@/lib/notes/types";
import { getAuthHeaders } from "@/lib/auth-client";

type NoteContext = {
  subject: SubjectName;
  chapterId: string;
  chapterTitle: string;
  topicId: string;
  topicTitle: string;
};

async function parseJsonSafe(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function getTopicNote(context: {
  subject: SubjectName;
  chapterId: string;
  topicId: string;
}): Promise<{ note: StudentTopicNote | null; error?: string }> {
  const authHeaders = await getAuthHeaders();
  const params = new URLSearchParams({
    subject: context.subject,
    chapterId: context.chapterId,
    topicId: context.topicId,
  });
  const response = await fetch(`/api/notes?${params.toString()}`, {
    headers: authHeaders,
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    return { note: null, error: data?.error || "Failed to load note" };
  }
  return { note: (data?.note as StudentTopicNote | null) ?? null };
}

export async function saveTopicNote(
  context: NoteContext,
  content: string
): Promise<{ note: StudentTopicNote | null; error?: string }> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch("/api/notes", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({ ...context, content }),
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    return { note: null, error: data?.error || "Failed to save note" };
  }
  return { note: (data?.note as StudentTopicNote | null) ?? null };
}

export async function deleteTopicNote(context: {
  subject: SubjectName;
  chapterId: string;
  topicId: string;
}): Promise<{ deleted: boolean; error?: string }> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch("/api/notes", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(context),
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    return { deleted: false, error: data?.error || "Failed to delete note" };
  }
  return { deleted: Boolean(data?.deleted) };
}

export async function listTopicNotes(subject?: SubjectName): Promise<{
  notes: StudentTopicNoteSummary[];
  error?: string;
}> {
  const authHeaders = await getAuthHeaders();
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  const query = params.toString();
  const response = await fetch(`/api/notes${query ? `?${query}` : ""}`, {
    headers: authHeaders,
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    return { notes: [], error: data?.error || "Failed to load notes" };
  }
  return { notes: (data?.notes as StudentTopicNoteSummary[]) ?? [] };
}

export function downloadNoteAsTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
