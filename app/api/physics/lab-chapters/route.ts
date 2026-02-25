import { getPhysicsLabChapterIdsFromFirestore } from "@/lib/physics/firestore";
import { createPhysicsRoute } from "@/lib/api/create-physics-route";

export const GET = createPhysicsRoute(
  "chapterIds",
  getPhysicsLabChapterIdsFromFirestore,
  "Failed to load physics lab chapters"
);
