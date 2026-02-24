import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { createRateLimiter } from "@/lib/api/shared";
import { ensureStudentProfile, updateStudentProfileName } from "@/lib/profile";
import type { ProfileView } from "@/lib/profile-types";

const updateLimiter = createRateLimiter(60_000, 20);

const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name must be 80 characters or less"),
});

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

async function getAuthedIdentity(request: NextRequest): Promise<{ uid: string; email: string; name?: string | null } | null> {
  const token = getBearerToken(request);
  if (!token) return null;
  const decoded = await verifyFirebaseIdToken(token);
  if (!decoded?.uid || !decoded?.email) return null;
  return {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name,
  };
}

export async function GET(request: NextRequest) {
  const identity = await getAuthedIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Student login required.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const profile = await ensureStudentProfile({
      uid: identity.uid,
      email: identity.email,
      nameHint: identity.name ?? null,
    });
    const view: ProfileView = { name: profile.name, email: profile.email };
    return NextResponse.json({ profile: view });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to load profile", code: "PROFILE_FAILURE", details }
        : { error: "Failed to load profile", code: "PROFILE_FAILURE" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const identity = await getAuthedIdentity(request);
  if (!identity) {
    return NextResponse.json({ error: "Student login required.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rateLimitKey = `profile:update:${identity.uid}`;
  if (await updateLimiter(rateLimitKey)) {
    return NextResponse.json({ error: "Rate limit exceeded. Please try again shortly.", code: "RATE_LIMIT" }, { status: 429 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", code: "INVALID_JSON" }, { status: 400 });
  }

  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return NextResponse.json({ error: "Invalid request", code: "VALIDATION" }, { status: 400 });
  }
  const keys = Object.keys(rawBody as Record<string, unknown>);
  if (keys.some((key) => key !== "name")) {
    return NextResponse.json({ error: "Only 'name' can be updated", code: "VALIDATION" }, { status: 400 });
  }

  const parsed = UpdateProfileSchema.safeParse(rawBody);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message, code: "VALIDATION" }, { status: 400 });
  }

  try {
    const ensured = await ensureStudentProfile({
      uid: identity.uid,
      email: identity.email,
      nameHint: identity.name ?? null,
    });
    const updated = await updateStudentProfileName(ensured.uid, parsed.data.name);
    const view: ProfileView = { name: updated.name, email: updated.email };
    return NextResponse.json({ profile: view });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Failed to update profile", code: "PROFILE_FAILURE", details }
        : { error: "Failed to update profile", code: "PROFILE_FAILURE" },
      { status: 500 },
    );
  }
}
