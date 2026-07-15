"use client";

import { X } from "lucide-react";
import { useBannerVisibility, dismissBanner } from "@/hooks";

interface BannerProps {
    content: React.ReactNode;
    dismissible?: boolean;
    id?: string; // Unique ID for localStorage key
    cooldownMinutes?: number; // Minutes before banner can show again
    gradient?: string; // CSS gradient string, e.g. "linear-gradient(to right, #ff6b6b, #feca57)"
    bgColor?: string; // Fallback solid color
}

export default function Banner({
    content,
    dismissible = true,
    id = "default",
    cooldownMinutes = 5,
    gradient,
    bgColor = "#ef4444"
}: BannerProps) {
    const isVisible = useBannerVisibility(id, cooldownMinutes);

    const handleDismiss = () => {
        dismissBanner(id);
    };

    if (!isVisible) return null;

    return (
        <div
            className="flex items-center justify-center text-white/90 text-sm py-1 px-4"
            style={{ background: gradient || bgColor }}
        >
            <div className="flex-1 text-center">
                {content}
            </div>
            {dismissible && (
                <button
                    onClick={handleDismiss}
                    className="p-1 hover:bg-white/20 rounded transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
