import "server-only";

import { getFirestoreClient } from "@/lib/firebase-admin";
import type { SubjectName } from "@/lib/learning-types";
import type { StudentTopicNote, StudentTopicNoteSummary } from "@/lib/notes/types";

const NOTES_COLLECTION = "student_topic_notes";

type UpsertArgs = {
  userId: string;
  subject: SubjectName;
  chapterId: string;
  chapterTitle: string;
  topicId: string;
  topicTitle: string;
  content: string;
};

function toContentPreview(content: string): string {
  const compact = content.replace(/\s+/g, " ").trim();
  if (compact.length <= 140) return compact;
  return `${compact.slice(0, 140)}...`;
}

export function makeStudentTopicNoteId(
  userId: string,
  subject: SubjectName,
  chapterId: string,
  topicId: string
): string {
  return `${userId}__${subject}__${chapterId}__${topicId}`;
}

export async function getStudentTopicNote(
  userId: string,
  subject: SubjectName,
  chapterId: string,
  topicId: string
): Promise<StudentTopicNote | null> {
  const db = getFirestoreClient();
  const id = makeStudentTopicNoteId(userId, subject, chapterId, topicId);
  const snap = await db.collection(NOTES_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() as StudentTopicNote | undefined;
  return data ?? null;
}

export async function upsertStudentTopicNote(args: UpsertArgs): Promise<StudentTopicNote> {
  const db = getFirestoreClient();
  const id = makeStudentTopicNoteId(args.userId, args.subject, args.chapterId, args.topicId);
  const now = Date.now();
  const ref = db.collection(NOTES_COLLECTION).doc(id);
  const existing = await ref.get();
  const createdAt =
    existing.exists && typeof existing.data()?.createdAt === "number"
      ? (existing.data()?.createdAt as number)
      : now;

  const note: StudentTopicNote = {
    id,
    userId: args.userId,
    subject: args.subject,
    chapterId: args.chapterId,
    chapterTitle: args.chapterTitle,
    topicId: args.topicId,
    topicTitle: args.topicTitle,
    content: args.content,
    createdAt,
    updatedAt: now,
  };

  await ref.set(note, { merge: true });
  return note;
}

export async function deleteStudentTopicNote(
  userId: string,
  subject: SubjectName,
  chapterId: string,
  topicId: string
): Promise<boolean> {
  const db = getFirestoreClient();
  const id = makeStudentTopicNoteId(userId, subject, chapterId, topicId);
  const ref = db.collection(NOTES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

export async function listStudentTopicNotes(
  userId: string,
  filter?: { subject?: SubjectName }
): Promise<StudentTopicNoteSummary[]> {
  const db = getFirestoreClient();
  const snap = await db.collection(NOTES_COLLECTION).where("userId", "==", userId).get();

  return snap.docs
    .map((doc) => doc.data() as StudentTopicNote)
    .filter((note) => (filter?.subject ? note.subject === filter.subject : true))
    .map((note) => ({
      id: note.id,
      subject: note.subject,
      chapterId: note.chapterId,
      chapterTitle: note.chapterTitle,
      topicId: note.topicId,
      topicTitle: note.topicTitle,
      contentPreview: toContentPreview(note.content),
      updatedAt: note.updatedAt,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
