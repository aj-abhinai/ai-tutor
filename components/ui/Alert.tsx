import { HTMLAttributes, forwardRef } from "react";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "error" | "success" | "warning" | "info";
}

const variantStyles: Record<string, string> = {
    error: "text-rose-700 bg-rose-50 border-rose-100",
    success: "text-emerald-800 bg-emerald-50 border-emerald-100",
    warning: "text-amber-800 bg-amber-50 border-amber-100",
    info: "text-slate-600 bg-white/70 border-slate-200",
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
    ({ variant = "info", className = "", children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                role="alert"
                aria-live="polite"
                className={`p-3 rounded-xl text-center border ${variantStyles[variant]} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Alert.displayName = "Alert";
