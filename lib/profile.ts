import { getFirestoreClient } from "@/lib/firebase-admin";
import type { StudentProfile } from "@/lib/profile-types";

const COLLECTION = "student_profiles";

type EnsureProfileInput = {
  uid: string;
  email: string;
  nameHint?: string | null;
};

function defaultNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  if (!local) return "Student";
  return local.slice(0, 1).toUpperCase() + local.slice(1);
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export async function ensureStudentProfile(input: EnsureProfileInput): Promise<StudentProfile> {
  const db = getFirestoreClient();
  const ref = db.collection(COLLECTION).doc(input.uid);
  const snap = await ref.get();
  const now = Date.now();

  if (snap.exists) {
    const existing = snap.data() as StudentProfile | undefined;
    if (existing?.uid && existing?.email) {
      return existing;
    }
  }

  const profile: StudentProfile = {
    uid: input.uid,
    email: input.email,
    name: normalizeName(input.nameHint || defaultNameFromEmail(input.email) || "Student"),
    createdAtMs: now,
    updatedAtMs: now,
  };
  await ref.set(profile, { merge: true });
  return profile;
}

export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  const db = getFirestoreClient();
  const snap = await db.collection(COLLECTION).doc(uid).get();
  if (!snap.exists) return null;
  return snap.data() as StudentProfile;
}

export async function updateStudentProfileName(uid: string, name: string): Promise<StudentProfile> {
  const normalized = normalizeName(name);
  const db = getFirestoreClient();
  const ref = db.collection(COLLECTION).doc(uid);
  await ref.set(
    {
      name: normalized,
      updatedAtMs: Date.now(),
    },
    { merge: true },
  );
  const snap = await ref.get();
  return snap.data() as StudentProfile;
}
