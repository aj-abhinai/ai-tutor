import { HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "highlight" | "subtle";
    padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles: Record<string, string> = {
    default: "bg-white shadow-md",
    highlight: "bg-white shadow-lg",
    subtle: "bg-gray-50 border border-gray-100",
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
