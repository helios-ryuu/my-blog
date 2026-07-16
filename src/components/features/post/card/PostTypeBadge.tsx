"use client";

import { useTranslations } from "next-intl";
import type { PostType } from "@/types/database";

interface PostTypeBadgeProps {
    type: PostType;
    order?: number | null;
    compact?: boolean;
    fullWidth?: boolean;
    className?: string;
}

export default function PostTypeBadge({ type, order, compact = false, fullWidth = false, className = "" }: PostTypeBadgeProps) {
    const t = useTranslations("post");
    const size = compact ? "text-[9px]" : "text-xs";
    if (type === "series") {
        return (
            <div className={`flex items-stretch justify-center overflow-hidden rounded-md border border-accent/50 bg-accent/30 ${fullWidth ? "w-full" : "w-full max-w-[110px]"} ${size} ${className}`}>
                <span className="flex items-center justify-center border-r border-accent/50 px-2 py-1 font-bold uppercase tracking-wider text-accent-hover">{t("typeSeries")}</span>
                <span className="flex flex-1 items-center justify-center px-2 py-1 font-bold text-accent-hover">{order ?? "?"}</span>
            </div>
        );
    }
    return (
        <div className={`flex items-center justify-center rounded-md border border-blue-500/40 bg-blue-500/20 ${fullWidth ? "w-full" : "w-full max-w-[110px]"} ${size} ${className}`}>
            <span className="px-2 py-1 font-bold uppercase tracking-wider text-blue-500">{t("typeStandalone")}</span>
        </div>
    );
}
