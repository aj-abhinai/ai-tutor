import { Suspense } from "react";
import QuickRevisionClientPage from "./QuickRevisionClientPage";

function PageSkeleton() {
    return (
        <main className="min-h-screen relative overflow-hidden bg-background px-6 py-8 flex flex-col items-center">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-secondary-light/40 blur-3xl" />
                <div className="absolute top-40 -right-10 h-72 w-72 rounded-full bg-accent-light/40 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary-light/30 blur-3xl" />
            </div>
            <div className="relative w-full max-w-4xl animate-pulse">
                <div className="mb-8 h-20 rounded-xl bg-surface/60" />
                <div className="h-12 rounded-xl bg-surface/40" />
            </div>
        </main>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <QuickRevisionClientPage />
        </Suspense>
    );
}
