"use client";

/**
 * MobileDisclaimer.tsx
 * Renders a banner on small screens advising desktop use.
 * Uses global Alert component — no chemistry-specific styles.
 */

import { Alert } from "@/components/ui/Alert";

export function MobileDisclaimer() {
    return (
        <div className="block sm:hidden mb-4">
            <Alert variant="warning">
                🖥️ The Chemistry Lab works best on a desktop or tablet. Some features may be limited on mobile.
            </Alert>
        </div>
    );
}
