import { Card, type CardProps } from "./Card";

interface StatusCardProps extends Omit<CardProps, "children"> {
    message: string;
    tone?: "muted" | "error";
}

export function StatusCard({ message, tone = "muted", className = "", ...props }: StatusCardProps) {
    const toneClass = tone === "error" ? "text-rose-700" : "text-slate-600";
    return (
        <Card className={`text-center ${toneClass} ${className}`.trim()} {...props}>
            {message}
        </Card>
    );
}
