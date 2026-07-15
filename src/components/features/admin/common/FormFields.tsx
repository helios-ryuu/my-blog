"use client";

import type { ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface FormFieldProps {
    label: string;
    required?: boolean;
    hint?: string;
    error?: string;
    warning?: string;
    children: ReactNode;
    className?: string;
    labelRight?: ReactNode;
    charCount?: { current: number; max: number };
}

export function FormField({
    label,
    required,
    hint,
    error,
    warning,
    children,
    className = "",
    labelRight,
    charCount,
}: FormFieldProps) {
    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-foreground/70">
                    {label} {required && "*"}
                    {hint && <span className="text-foreground/40 ml-1">({hint})</span>}
                </label>
                <div className="flex items-center gap-2">
                    {charCount && (
                        <span className={`text-xs ${charCount.current > charCount.max ? "text-red-500" : "text-foreground/40"}`}>
                            {charCount.current}/{charCount.max}
                        </span>
                    )}
                    {labelRight}
                </div>
            </div>
            {children}
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            {warning && !error && <p className="mt-1 text-sm text-yellow-500">{warning}</p>}
        </div>
    );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hasError?: boolean;
    hasWarning?: boolean;
    restrictToPositiveInteger?: boolean;
}

export function FormInput({ hasError, hasWarning, restrictToPositiveInteger, className = "", ...props }: FormInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (restrictToPositiveInteger && ["+", "-", "e", "E"].includes(e.key)) {
            e.preventDefault();
        }
        props.onKeyDown?.(e);
    };

    return (
        <input
            {...props}
            onKeyDown={handleKeyDown}
            className={`w-full px-3 py-2 rounded-md border bg-background text-foreground text-sm focus:outline-none focus:ring-2 transition-colors ${hasError
                    ? "border-red-500 focus:ring-red-500/50"
                    : hasWarning
                        ? "border-yellow-500 focus:ring-yellow-500/50"
                        : "border-(--border-color) focus:ring-accent/50"
                } ${className}`}
        />
    );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    hasError?: boolean;
    hasWarning?: boolean;
}

export function FormTextarea({ hasError, hasWarning, className = "", ...props }: FormTextareaProps) {
    return (
        <textarea
            {...props}
            className={`w-full px-3 py-2 rounded-md border bg-background text-foreground text-sm focus:outline-none focus:ring-2 transition-colors resize-none ${hasError
                    ? "border-red-500 focus:ring-red-500/50"
                    : hasWarning
                        ? "border-yellow-500 focus:ring-yellow-500/50"
                        : "border-(--border-color) focus:ring-accent/50"
                } ${className}`}
        />
    );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    hasError?: boolean;
}

export function FormSelect({ hasError, className = "", children, ...props }: FormSelectProps) {
    return (
        <select
            {...props}
            className={`w-full px-3 py-2 rounded-md border bg-background text-foreground text-sm focus:outline-none focus:ring-2 transition-colors ${hasError
                    ? "border-red-500 focus:ring-red-500/50"
                    : "border-(--border-color) focus:ring-accent/50"
                } ${className}`}
        >
            {children}
        </select>
    );
}

// Styled dropdown matching SelectDropdown design
interface SelectOption {
    value: string | number;
    label: string;
}

interface FormSelectDropdownProps {
    options: SelectOption[];
    value?: string;
    placeholder?: string;
    className?: string;
    onChange?: (value: string) => void;
    hasError?: boolean;
    required?: boolean;
    name?: string;
    disabled?: boolean;
}

export function FormSelectDropdown({
    options,
    value = "",
    placeholder = "Select...",
    className = "",
    onChange,
    hasError,
    name,
    disabled,
}: FormSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => String(opt.value) === value);
    const displayText = selectedOption?.label || placeholder;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const handleSelect = (optValue: string | number) => {
        onChange?.(String(optValue));
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Hidden input for form compatibility */}
            <input type="hidden" name={name} value={value} />

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-3 py-2 pr-10 rounded-md border bg-background text-sm text-left flex items-center justify-between transition-colors ${disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    } ${hasError
                        ? "border-red-500"
                        : "border-(--border-color)"
                    } ${value ? "text-foreground" : "text-foreground/60"}`}
            >
                <span className="truncate">{displayText}</span>
                <ChevronDown
                    size={16}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-foreground/60 transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 space-y-0.5 w-full mt-1 p-1 rounded-md border border-(--border-color) bg-background shadow-lg max-h-[210px] overflow-auto">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelect(opt.value)}
                            className={`w-full flex items-center px-3 py-2 text-sm rounded-md cursor-pointer transition-colors text-left ${String(opt.value) === value
                                    ? "bg-accent/20 text-accent"
                                    : "text-foreground hover:bg-accent/20"
                                }`}
                        >
                            <span className="truncate">{opt.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

interface FormMessageProps {
    type: "error" | "success";
    message: string;
}

export function FormMessage({ type, message }: FormMessageProps) {
    if (!message) return null;

    const styles = type === "error"
        ? "text-red-500 bg-red-500/10 border-red-500/20"
        : "text-green-500 bg-green-500/10 border-green-500/20";

    return (
        <div className={`text-sm text-center py-2 px-3 rounded-md border ${styles}`}>
            {message}
        </div>
    );
}
