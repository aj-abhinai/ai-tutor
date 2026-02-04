import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { }

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`w-full p-4 text-lg border-2 border-gray-200 rounded-lg focus:border-teal-500 outline-none ${className}`}
                {...props}
            />
        );
    }
);

Input.displayName = "Input";
