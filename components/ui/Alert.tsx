import { HTMLAttributes, forwardRef } from "react";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "error" | "success" | "warning" | "info";
}

const variantStyles: Record<string, string> = {
    error: "text-red-600 bg-red-50 border-red-100",
    success: "text-green-700 bg-green-50 border-green-100",
    warning: "text-yellow-700 bg-yellow-50 border-yellow-100",
    info: "text-gray-600 bg-white border-gray-100",
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
    ({ variant = "info", className = "", children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                role="alert"
                aria-live="polite"
                className={`p-3 rounded-lg text-center border ${variantStyles[variant]} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Alert.displayName = "Alert";
