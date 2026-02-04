import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { }

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-base text-slate-900 outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 placeholder:text-slate-400 ${className}`}
                {...props}
            />
        );
    }
);

Input.displayName = "Input";
