"server-only";

import { getFirestoreClient } from "@/lib/firebase-admin";
import type { SubjectName } from "@/lib/learning-types";
import type { TopicImage, TopicImageSummary, CreateTopicImageArgs, UpdateTopicImageArgs } from "./types";

const TOPIC_IMAGES_COLLECTION = "topic_images";

export async function getTopicImagesByChapterAndTopic(
  subject: SubjectName,
  chapterId: string,
  topicId: string,
  options?: { subtopicId?: string; type?: "comic" | "diagram" | "illustration" }
): Promise<TopicImageSummary[]> {
  const db = getFirestoreClient();
  const snap = await db
    .collection(TOPIC_IMAGES_COLLECTION)
    .where("subject", "==", subject)
    .where("chapterId", "==", chapterId)
    .where("topicId", "==", topicId)
    .get();

  let images = snap.docs.map((doc) => {
    const data = doc.data() as Partial<TopicImage> & { url?: string };
    return {
      id: data.id || doc.id,
      subject: (data.subject as SubjectName) || subject,
      chapterId: data.chapterId || chapterId,
      topicId: data.topicId || topicId,
      subtopicId: data.subtopicId,
      title: data.title || "Topic Image",
      imageUrl: data.imageUrl || data.url || "",
      caption: data.caption,
      type: (data.type as "comic" | "diagram" | "illustration") || "diagram",
    } satisfies TopicImageSummary;
  });

  images = images.filter((img) => Boolean(img.imageUrl));
  if (options?.subtopicId) {
    const target = options.subtopicId.trim();
    images = images.filter((img) => (img.subtopicId || "").trim() === target);
  }
  if (options?.type) {
    images = images.filter((img) => img.type === options.type);
  }

  return images;
}

export async function getTopicImageById(id: string): Promise<TopicImage | null> {
  const db = getFirestoreClient();
  const doc = await db.collection(TOPIC_IMAGES_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as TopicImage;
}

export async function createTopicImage(args: CreateTopicImageArgs): Promise<TopicImage> {
  const db = getFirestoreClient();
  const now = Date.now();
  const scopedSubtopic = (args.subtopicId || "topic").trim();
  const id = `${args.subject}__${args.chapterId}__${args.topicId}__${scopedSubtopic}__${Date.now()}`;
  
  const image: TopicImage = {
    id,
    subject: args.subject,
    chapterId: args.chapterId,
    topicId: args.topicId,
    subtopicId: args.subtopicId,
    title: args.title,
    imageUrl: args.imageUrl,
    caption: args.caption,
    type: args.type,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(TOPIC_IMAGES_COLLECTION).doc(id).set(image);
  return image;
}

export async function updateTopicImage(id: string, args: UpdateTopicImageArgs): Promise<TopicImage | null> {
  const db = getFirestoreClient();
  const ref = db.collection(TOPIC_IMAGES_COLLECTION).doc(id);
  const doc = await ref.get();
  
  if (!doc.exists) return null;
  
  const existing = doc.data() as TopicImage;
  const updated: TopicImage = {
    ...existing,
    ...args,
    updatedAt: Date.now(),
  };

  await ref.set(updated, { merge: true });
  return updated;
}

export async function deleteTopicImage(id: string): Promise<boolean> {
  const db = getFirestoreClient();
  const ref = db.collection(TOPIC_IMAGES_COLLECTION).doc(id);
  const doc = await ref.get();
  
  if (!doc.exists) return false;
  
  await ref.delete();
  return true;
}
