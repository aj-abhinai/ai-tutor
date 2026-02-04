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
            "relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400";

        const activeClass = isActive
            ? "border-emerald-300 bg-emerald-50/70 shadow-[0_14px_30px_rgba(16,185,129,0.2)]"
            : "hover:border-emerald-200 hover:shadow-[0_10px_20px_rgba(15,23,42,0.08)]";

        const disabledClass = disabled ? "opacity-60 cursor-not-allowed" : "";

        return (
            <button
                ref={ref}
                disabled={disabled}
                aria-pressed={isActive}
                className={`${baseClass} ${activeClass} ${disabledClass} ${className}`}
                {...props}
            >
                {isActive && (
                    <span className="absolute inset-x-0 top-0 h-1 bg-emerald-400" />
                )}
                {icon && <div className="mb-2">{icon}</div>}
                <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
                <div className="text-lg font-semibold text-slate-900 mt-1">{title}</div>
                <div className="text-sm text-slate-600 mt-1">{description}</div>
            </button>
        );
    }
);

NavCard.displayName = "NavCard";
