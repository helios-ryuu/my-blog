"use client";

import { X } from "lucide-react";
import { dismissBanner, useBannerVisibility } from "@/hooks";
import { useTranslations } from "next-intl";

interface BannerProps {
    content: React.ReactNode;
    dismissible?: boolean;
    id?: string;
    cooldownMinutes?: number;
    gradient?: string;
    bgColor?: string;
}

export default function Banner({
    content,
    dismissible = true,
    id = "default",
    cooldownMinutes = 5,
    gradient,
    bgColor = "#ef4444",
}: BannerProps) {
    const t = useTranslations("common");
    const isVisible = useBannerVisibility(id, cooldownMinutes);

    if (!isVisible) return null;

    return (
        <div
            className="flex min-h-8 items-center px-3 py-1 text-sm text-white/90"
            style={{ background: gradient || bgColor }}
        >
            <div className="min-w-0 flex-1 text-center">{content}</div>
            {dismissible && (
                <button
                    type="button"
                    onClick={() => dismissBanner(id)}
                    className="ml-2 inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded transition-colors hover:bg-white/20"
                    aria-label={t("close")}
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
