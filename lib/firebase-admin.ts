/**
 * Firebase Admin SDK — lazy singleton for Firestore access.
 * Usage: getFirestoreClient() returns the shared DB instance.
 *
 * Reads credentials from GOOGLE_APPLICATION_CREDENTIALS env var
 * or falls back to ./service-account.json in project root.
 */

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let db: Firestore | undefined;

export function getFirestoreClient(): Firestore {
    if (db) return db;

    if (getApps().length === 0) {
        // GOOGLE_APPLICATION_CREDENTIALS is the standard way;
        // if not set, try loading service-account.json from project root.
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        app = initializeApp(
            credPath
                ? { credential: cert(credPath) }
                : { credential: cert("./service-account.json") }
        );
    } else {
        app = getApps()[0];
    }

    db = getFirestore(app);
    return db;
}
