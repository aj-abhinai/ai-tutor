import React from "react";

interface StatusCardProps {
    message: string;
    tone?: "info" | "muted" | "error";
}

export function StatusCard({ message, tone = "info" }: StatusCardProps) {
    const toneClass = tone === "error" ? "text-error" : "text-text-muted";
    return (
        <div className={`rounded-xl border border-border bg-surface/70 px-5 py-4 text-sm ${toneClass}`}>
            {message}
        </div>
    );
}
