"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SectionCardProps {
    // Required
    title: string;
    description: string;

    // Optional - className for custom styling (e.g., col-span)
    className?: string;

    // Optional - color variant for card background
    colorVariant?: "accent" | "blue" | "red";

    // Optional - clickable card (for Create section)
    onClick?: () => void;
    icon?: LucideIcon;

    // Optional - button
    buttonText?: string;
    buttonVariant?: "default" | "danger";
    buttonDisabled?: boolean;
    onButtonClick?: () => void;

    // Optional - legend/footer text
    legend?: ReactNode;

    // Optional - custom control rendered before the action button
    children?: ReactNode;
}

export function SectionCard({
    title,
    description,
    className = "",
    colorVariant = "accent",
    onClick,
    icon: Icon,
    buttonText,
    buttonVariant = "default",
    buttonDisabled = false,
    onButtonClick,
    legend,
    children,
}: SectionCardProps) {
    // Color classes based on variant
    const colorClasses = {
        accent: "bg-accent/20 hover:bg-accent/35 border-accent/30",
        blue: "bg-blue-500/20 hover:bg-blue-500/35 border-blue-500/30",
        red: "bg-red-500/20 hover:bg-red-500/35 border-red-500/30",
    };

    const iconColorClasses = {
        accent: "bg-accent/30 text-accent",
        blue: "bg-blue-500/30 text-blue-500",
        red: "bg-red-500/30 text-red-500",
    };

    // Clickable card variant (for Create section)
    if (onClick && Icon) {
        return (
            <button
                onClick={onClick}
                className={`p-4 rounded-lg border transition-colors text-left group flex flex-col cursor-pointer ${colorClasses[colorVariant]} ${className}`}
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${iconColorClasses[colorVariant]}`}>
                        <Icon size={24} />
                    </div>
                    <h3 className="font-semibold text-foreground">{title}</h3>
                </div>
                <p className="text-sm text-foreground/60 flex-1">{description}</p>
            </button>
        );
    }

    // Standard card with select/button
    const variantButtonClasses = {
        accent: buttonDisabled ? "bg-accent/50 cursor-not-allowed" : "bg-accent hover:bg-accent/90 cursor-pointer",
        blue: buttonDisabled ? "bg-blue-500/50 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 cursor-pointer",
        red: buttonDisabled ? "bg-red-500/50 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 cursor-pointer",
    };

    const buttonClasses = buttonVariant === "danger"
        ? `w-full px-3 py-2 text-sm rounded-md transition-colors bg-red-700/20 text-red-700 border border-red-700/30 ${buttonDisabled
            ? "cursor-not-allowed"
            : "hover:border-red-700/80 cursor-pointer"
        }`
        : `w-full px-3 py-2 text-white text-sm rounded-md transition-colors ${variantButtonClasses[colorVariant]}`;

    return (
        <div className={`p-4 rounded-lg border transition-colors ${colorClasses[colorVariant]} ${className}`}>
            {Icon ? (
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${iconColorClasses[colorVariant]}`}>
                        <Icon size={20} />
                    </div>
                    <h3 className="font-medium text-foreground">{title}</h3>
                </div>
            ) : (
                <h3 className="font-medium text-foreground mb-2">{title}</h3>
            )}
            <p className="text-sm text-foreground/60 mb-3">{description}</p>

            {children && (
                <div className={buttonText ? "mb-2" : ""}>{children}</div>
            )}

            {buttonText && onButtonClick && (
                <button
                    onClick={onButtonClick}
                    disabled={buttonDisabled}
                    className={buttonClasses}
                >
                    {buttonText}
                </button>
            )}

            {legend && (
                <p className="text-xs text-foreground/40 mt-2">{legend}</p>
            )}
        </div>
    );
}
