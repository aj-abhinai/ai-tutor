import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
}

const variantStyles: Record<string, string> = {
    primary:
        "bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 shadow-lg",
    secondary:
        "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50",
    ghost:
        "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50",
    danger:
        "bg-red-500 text-white hover:bg-red-600 disabled:opacity-50",
};

const sizeStyles: Record<string, string> = {
    sm: "px-3 py-2 text-sm rounded-lg",
    md: "px-4 py-3 text-base rounded-xl font-bold",
    lg: "px-6 py-4 text-xl rounded-xl font-bold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", size = "md", fullWidth, className = "", children, ...props }, ref) => {
        const base = "transition-all duration-200 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-400";
        const width = fullWidth ? "w-full" : "";

        return (
            <button
                ref={ref}
                className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${width} ${className}`}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
