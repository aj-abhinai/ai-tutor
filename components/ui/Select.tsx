import React, { useEffect, useMemo, useRef, useState } from "react";

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
    label?: string;
    options?: SelectOption[];
    placeholder?: string;
}

export function Select({
    label,
    disabled,
    options = [],
    placeholder,
    className = "",
    value,
    defaultValue,
    onChange,
    name,
    ...rest
}: SelectProps) {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string>(String(defaultValue ?? ""));
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const currentValue = isControlled ? String(value ?? "") : internalValue;
    const selected = useMemo(
        () => options.find((opt) => opt.value === currentValue) ?? null,
        [currentValue, options]
    );

    useEffect(() => {
        function handlePointerDown(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, []);

    function handleSelect(nextValue: string) {
        if (disabled) return;
        if (!isControlled) setInternalValue(nextValue);
        onChange?.({
            target: { value: nextValue, name: name ?? "" },
            currentTarget: { value: nextValue, name: name ?? "" },
        } as React.ChangeEvent<HTMLSelectElement>);
        setIsOpen(false);
    }

    const triggerClasses = disabled
        ? "bg-muted-bg border-border text-text-muted/50 cursor-not-allowed"
        : "bg-surface/90 border-border text-text hover:border-accent focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary-light cursor-pointer";

    return (
        <label className="block">
            {label && (
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {label}
                </span>
            )}
            <div className={`relative ${isOpen ? "z-50" : ""}`} ref={rootRef}>
                <button
                    type="button"
                    disabled={disabled}
                    className={`w-full rounded-xl border px-4 py-3 pr-10 text-left text-base outline-none transition-colors ${triggerClasses} ${className}`}
                    onClick={() => setIsOpen((prev) => !prev)}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") setIsOpen(false);
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <span className={selected ? "text-text" : "text-text-muted"}>
                        {selected?.label ?? placeholder ?? "Select an option"}
                    </span>
                </button>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-secondary transition-colors group-focus-within:text-secondary">
                    <svg className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.12l3.71-3.9a.75.75 0 0 1 1.08 1.04l-4.25 4.47a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </span>

                {isOpen && !disabled && (
                    <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-surface shadow-[0_12px_24px_rgba(10,24,54,0.12)]">
                        {placeholder && (
                            <button
                                type="button"
                                className={`block w-full px-4 py-2 text-left text-sm transition-colors ${currentValue === ""
                                    ? "bg-secondary text-text-on-secondary"
                                    : "bg-surface text-text hover:bg-accent-light/70"
                                    }`}
                                onClick={() => handleSelect("")}
                                role="option"
                                aria-selected={currentValue === ""}
                            >
                                {placeholder}
                            </button>
                        )}
                        {options.map((opt) => {
                            const isSelected = currentValue === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`block w-full px-4 py-2 text-left text-sm transition-colors ${isSelected
                                        ? "bg-secondary text-text-on-secondary"
                                        : "bg-surface text-text hover:bg-accent-light/70"
                                        }`}
                                    onClick={() => handleSelect(opt.value)}
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {name && <input type="hidden" name={name} value={currentValue} />}
            <select {...rest} className="sr-only" tabIndex={-1} aria-hidden value={currentValue} onChange={() => { }}>
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
