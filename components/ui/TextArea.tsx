import { TextareaHTMLAttributes, forwardRef } from "react";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    variant?: "default" | "teal" | "indigo";
}

const variantStyles: Record<string, string> = {
    default: "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200",
    teal: "border-emerald-200 bg-emerald-50/40 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200",
    indigo: "border-sky-200 bg-sky-50/40 focus:border-sky-400 focus:ring-2 focus:ring-sky-200",
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ variant = "default", className = "", ...props }, ref) => {
        return (
            <textarea
                ref={ref}
                className={`w-full rounded-xl border bg-white p-3 text-sm text-slate-700 outline-none transition-colors ${variantStyles[variant]} ${className}`}
                {...props}
            />
        );
    }
);

TextArea.displayName = "TextArea";
