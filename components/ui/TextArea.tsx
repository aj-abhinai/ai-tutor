import { TextareaHTMLAttributes, forwardRef } from "react";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    variant?: "default" | "teal" | "indigo";
}

const variantStyles: Record<string, string> = {
    default: "border-gray-200 focus:border-teal-400",
    teal: "border-teal-200 focus:border-teal-400",
    indigo: "border-indigo-200 focus:border-indigo-400",
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ variant = "default", className = "", ...props }, ref) => {
        return (
            <textarea
                ref={ref}
                className={`w-full rounded-xl border bg-white p-3 text-sm text-gray-700 focus:outline-none ${variantStyles[variant]} ${className}`}
                {...props}
            />
        );
    }
);

TextArea.displayName = "TextArea";
