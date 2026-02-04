import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

export interface NavCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    title: string;
    description: string;
    isActive?: boolean;
    icon?: ReactNode;
}

export const NavCard = forwardRef<HTMLButtonElement, NavCardProps>(
    ({ label, title, description, isActive = false, icon, disabled, className = "", ...props }, ref) => {
        const baseClass =
            "rounded-2xl border-2 p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400";

        const activeClass = isActive
            ? "border-teal-500 bg-teal-50 shadow-lg"
            : "border-gray-200 bg-white hover:border-teal-300";

        const disabledClass = disabled ? "opacity-60 cursor-not-allowed" : "";

        return (
            <button
                ref={ref}
                disabled={disabled}
                aria-pressed={isActive}
                className={`${baseClass} ${activeClass} ${disabledClass} ${className}`}
                {...props}
            >
                {icon && <div className="mb-2">{icon}</div>}
                <div className="text-xs uppercase text-gray-500">{label}</div>
                <div className="text-lg font-semibold text-gray-800 mt-1">{title}</div>
                <div className="text-sm text-gray-600 mt-1">{description}</div>
            </button>
        );
    }
);

NavCard.displayName = "NavCard";
