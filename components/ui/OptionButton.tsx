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
        let style = "border-gray-200 hover:border-teal-300 hover:bg-teal-50";

        if (showResult) {
            if (isCorrect) {
                style = "bg-green-100 border-green-500";
            } else if (isSelected) {
                style = "bg-red-100 border-red-500";
            }
        } else if (isSelected) {
            style = "bg-teal-100 border-teal-500 shadow-md transform scale-[1.02]";
        }

        return (
            <button
                ref={ref}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${style} ${className}`}
                {...props}
            >
                <span className="font-bold mr-3">{label}.</span>
                <span dangerouslySetInnerHTML={{ __html: text }} />
                {showResult && isCorrect && <span className="float-right">Correct</span>}
                {showResult && isSelected && !isCorrect && (
                    <span className="float-right">Incorrect</span>
                )}
            </button>
        );
    }
);

OptionButton.displayName = "OptionButton";
