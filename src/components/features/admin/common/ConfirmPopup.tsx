"use client";

import { useState } from "react";
import { X, AlertTriangle, Info, Trash2 } from "lucide-react";
import { Button } from "./Button";
import { useEscapeKey } from "@/hooks/useEscapeKey";

import { LucideIcon } from "lucide-react";
import { ButtonVariant } from "./Button";

type ConfirmVariant = "info" | "warning" | "danger";

interface ConfirmPopupProps {
    variant: ConfirmVariant;
    title: string;
    message: string;
    itemName?: string; // For danger variant - user must type this to confirm
    confirmText?: string;
    cancelText?: string;
    hideCancelButton?: boolean;
    icon?: LucideIcon; // Override default variant icon
    onConfirm: () => Promise<void> | void;
    onCancel: () => void;
    children?: React.ReactNode; // Custom content between message and confirmation input
}

const variantConfig: Record<ConfirmVariant, {
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    buttonVariant: ButtonVariant;
    borderColor: string;
}> = {
    info: {
        icon: Info,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-500",
        buttonVariant: "info",
        borderColor: "border-blue-500/30",
    },
    warning: {
        icon: AlertTriangle,
        iconBg: "bg-yellow-500/10",
        iconColor: "text-yellow-500",
        buttonVariant: "unpublish",
        borderColor: "border-yellow-500/30",
    },
    danger: {
        icon: Trash2,
        iconBg: "bg-red-500/10",
        iconColor: "text-red-500",
        buttonVariant: "danger",
        borderColor: "border-red-500/30",
    },
};

export default function ConfirmPopup({
    variant,
    title,
    message,
    itemName,
    confirmText = "Confirm",
    cancelText = "Cancel",
    hideCancelButton = false,
    icon: CustomIcon,
    onConfirm,
    onCancel,
    children,
}: ConfirmPopupProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [confirmInput, setConfirmInput] = useState("");

    const config = variantConfig[variant];
    const Icon = CustomIcon || config.icon;

    // For danger variant, require typing the item name
    const requiresInput = variant === "danger" && itemName;
    const inputMatches = !requiresInput || confirmInput === itemName;

    // Close on Escape key (disabled during loading)
    useEscapeKey(onCancel, !isLoading);

    const handleConfirm = async () => {
        if (!inputMatches) return;

        setIsLoading(true);
        try {
            await onConfirm();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => !isLoading && onCancel()}
        >
            <div
                className={`relative w-full max-w-md mx-4 p-6 rounded-xl border ${config.borderColor} bg-background shadow-2xl`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="absolute top-4 right-4 p-1 text-foreground/50 hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-full ${config.iconBg}`}>
                        <Icon size={24} className={config.iconColor} />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                </div>

                {/* Message */}
                <p className="text-foreground/70 mb-4">{message}</p>

                {/* Item name display for danger */}
                {itemName && (
                    <p className="text-foreground font-medium mb-4 p-2 bg-foreground/5 rounded text-sm">
                        {itemName}
                    </p>
                )}

                {/* Custom preview content */}
                {children && <div className="mb-4">{children}</div>}

                {/* Danger confirmation input */}
                {requiresInput && (
                    <div className="mb-6">
                        <div className="mb-2">
                            <label className="block text-sm text-foreground/60">
                                Type <span className="font-bold text-red-500">{itemName}</span> to confirm:
                            </label>
                        </div>
                        <input
                            type="text"
                            value={confirmInput}
                            onChange={(e) => setConfirmInput(e.target.value)}
                            placeholder="Enter name to confirm"
                            className="w-full px-3 py-2 rounded-md border border-(--border-color) bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            autoFocus
                        />
                    </div>
                )}

                {/* Warning for danger actions */}
                {variant === "danger" && (
                    <p className="text-sm text-red-500 mb-6">
                        ⚠️ This action cannot be undone.
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    {!hideCancelButton && (
                        <Button
                            variant="cancel"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        variant={config.buttonVariant}
                        onClick={handleConfirm}
                        disabled={isLoading || !inputMatches}
                        isLoading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
