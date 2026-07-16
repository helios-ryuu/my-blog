"use client";

import { useTranslations } from "next-intl";
import { POST_LEVEL_LABEL_KEYS, type PostLevel } from "@/types/database";

const STYLE: Record<PostLevel, string> = {
    beginner: "border-green-500/35 bg-green-500/12 text-green-700 dark:text-green-400",
    intermediate: "border-amber-500/40 bg-amber-500/12 text-amber-700 dark:text-amber-400",
    advanced: "border-red-500/40 bg-red-500/12 text-red-600 dark:text-red-400",
};

export default function PostLevelBadge({
    level,
    compact = false,
    className = "",
}: {
    level: PostLevel;
    compact?: boolean;
    className?: string;
}) {
    const t = useTranslations("post");
    const size = compact ? "px-1.5 py-1 text-[9px]" : "px-2.5 py-1 text-[10px]";

    return (
        <span className={`inline-flex items-center rounded-full border font-semibold leading-none ${size} ${STYLE[level]} ${className}`}>
            {t(POST_LEVEL_LABEL_KEYS[level])}
        </span>
    );
}
