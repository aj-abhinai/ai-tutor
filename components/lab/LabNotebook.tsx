"use client";

/**
 * LabNotebook.tsx
 * Displays a session log of reactions completed during the current lab session.
 * Layer: lab-shared. Uses global Card, Badge.
 */

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { type Reaction } from "@/lib/reactions";

export interface LogEntry {
    id: string;       // unique per session
    chemicalA: string;
    chemicalB: string;
    reaction: Reaction | null;
    concept?: string;
    timestamp: number;
}

interface LabNotebookProps {
    entries: LogEntry[];
}

function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function LabNotebook({ entries }: LabNotebookProps) {
    if (entries.length === 0) {
        return (
            <Card variant="subtle" padding="md" className="text-center text-slate-400 text-sm">
                📓 Your lab notebook is empty — complete a reaction to add an entry.
            </Card>
        );
    }

    return (
        <div className="lab-notebook">
            <h3 className="lab-notebook-title">📓 Lab Notebook</h3>
            <div className="lab-notebook-entries">
                {entries.map((entry) => (
                    <Card key={entry.id} variant="subtle" padding="sm" className="lab-notebook-entry">
                        <div className="lab-notebook-entry-top">
                            <span className="lab-notebook-chemicals">
                                {entry.chemicalA.replace(/ \(.+\)$/, "")}
                                {" + "}
                                {entry.chemicalB.replace(/ \(.+\)$/, "")}
                            </span>
                            <span className="lab-notebook-time">{formatTime(entry.timestamp)}</span>
                        </div>
                        <div className="lab-notebook-entry-bottom">
                            {entry.reaction ? (
                                <>
                                    <Badge variant="emerald">{entry.reaction.category}</Badge>
                                    {entry.concept && (
                                        <span className="lab-notebook-concept">{entry.concept}</span>
                                    )}
                                </>
                            ) : (
                                <Badge variant="gray">No Reaction</Badge>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
