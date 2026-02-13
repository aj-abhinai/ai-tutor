import { ButtonHTMLAttributes, forwardRef } from "react";

export interface OptionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    text: string;
    isSelected?: boolean;
    isCorrect?: boolean;
    showResult?: boolean;
}

export const OptionButton = forwardRef<HTMLButtonElement, OptionButtonProps>(
    ({ label, text, isSelected, isCorrect, showResult, className = "", ...props }, ref) => {
        let style =
            "border-slate-200 bg-white/80 text-slate-800 hover:border-emerald-200 hover:bg-emerald-50/60";
        let labelStyle = "bg-slate-100 text-slate-700";

        if (showResult) {
            if (isCorrect) {
                style = "bg-emerald-100 border-emerald-500 text-emerald-900";
                labelStyle = "bg-emerald-200 text-emerald-900";
            } else if (isSelected) {
                style = "bg-rose-100 border-rose-400 text-rose-900";
                labelStyle = "bg-rose-200 text-rose-900";
            }
        } else if (isSelected) {
            style =
                "bg-emerald-100 border-emerald-500 text-emerald-900 shadow-sm transform scale-[1.01]";
            labelStyle = "bg-emerald-200 text-emerald-900";
        }

        const showStatus = showResult && (isCorrect || isSelected);
        const statusText = isCorrect ? "Correct" : "Incorrect";

        return (
            <button
                ref={ref}
                className={`w-full rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 ${style} ${className}`}
                {...props}
            >
                <div className="flex items-start gap-3">
                    <span
                        className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${labelStyle}`}
                    >
                        {label}
                    </span>
                    <span
                        className="flex-1 min-w-0 text-sm leading-relaxed"
                    >
                        {text}
                    </span>
                    {showStatus && (
                        <span
                            className={`text-xs font-semibold ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}
                        >
                            {statusText}
                        </span>
                    )}
                </div>
            </button>
        );
    }
);

OptionButton.displayName = "OptionButton";
