/**
 * Firebase Admin SDK — lazy singleton for Firestore access.
 * Usage: getFirestoreClient() returns the shared DB instance.
 *
 * Preferred: FIREBASE_SERVICE_ACCOUNT as JSON string (Vercel-friendly).
 * Also supports GOOGLE_APPLICATION_CREDENTIALS as JSON string or file path.
 * Local fallback: ./service-account.json in project root.
 */

import { readFileSync } from "node:fs";
import {
    initializeApp,
    getApps,
    cert,
    type App,
    type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

let app: App | undefined;
let db: Firestore | undefined;
let storage: Storage | undefined;

function normalizeServiceAccount(input: string): ServiceAccount {
    const parsed = JSON.parse(input) as Record<string, unknown>;

    const projectId = (parsed.projectId ?? parsed.project_id) as string | undefined;
    const clientEmail = (parsed.clientEmail ?? parsed.client_email) as string | undefined;
    let privateKey = (parsed.privateKey ?? parsed.private_key) as string | undefined;

    if (privateKey) {
        privateKey = privateKey.replace(/\\n/g, "\n");
    }

    return {
        projectId,
        clientEmail,
        privateKey,
    };
}

function readServiceAccountFromEnvOrFile(): ServiceAccount {
    const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (inlineJson && inlineJson.trim().startsWith("{")) {
        return normalizeServiceAccount(inlineJson.trim());
    }

    const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (gac) {
        const trimmed = gac.trim();
        if (trimmed.startsWith("{")) {
            return normalizeServiceAccount(trimmed);
        }
        return normalizeServiceAccount(readFileSync(trimmed, "utf8"));
    }

    return normalizeServiceAccount(readFileSync("./service-account.json", "utf8"));
}

function normalizeBucketName(raw: string): string {
    const trimmed = raw.trim();
    const withoutProtocol = trimmed.replace(/^gs:\/\//, "");
    return withoutProtocol.split("/")[0];
}

function getOrInitApp(): App {
    if (app) return app;

    if (getApps().length > 0) {
        app = getApps()[0];
        return app;
    }

    const serviceAccount = readServiceAccountFromEnvOrFile();
    const envBucket =
        process.env.FIREBASE_STORAGE_BUCKET ||
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const storageBucket = envBucket ? normalizeBucketName(envBucket) : undefined;

    app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket,
    });
    return app;
}

export function getFirestoreClient(): Firestore {
    if (db) return db;
    db = getFirestore(getOrInitApp());
    return db;
}

export function getStorageClient(): Storage {
    if (storage) return storage;
    storage = getStorage(getOrInitApp());
    return storage;
}

export async function verifyFirebaseIdToken(token: string): Promise<DecodedIdToken | null> {
    if (!token) return null;
    try {
        getOrInitApp();
        const auth = getAuth();
        return await auth.verifyIdToken(token);
    } catch {
        return null;
    }
}
