import { HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "highlight" | "subtle";
    padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles: Record<string, string> = {
    default:
        "bg-white/85 border border-slate-200 shadow-[0_16px_32px_rgba(15,23,42,0.08)] backdrop-blur-sm",
    highlight:
        "bg-white/90 border border-slate-200 shadow-[0_24px_48px_rgba(15,23,42,0.12)] backdrop-blur-sm",
    subtle: "bg-white/70 border border-slate-200 shadow-[0_10px_24px_rgba(15,23,42,0.06)]",
};

const paddingStyles: Record<string, string> = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ variant = "default", padding = "md", className = "", children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`rounded-xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";
