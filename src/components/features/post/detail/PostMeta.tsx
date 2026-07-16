"use client";

import { useTranslations } from "next-intl";
import type { PostLevel, PostType } from "@/types/database";
import PostLevelBadge from "../card/PostLevelBadge";
import PostTypeBadge from "../card/PostTypeBadge";

export default function PostMeta({ date, readingTime, level, type, seriesOrder }: { date: string; readingTime: number; level: PostLevel; type: PostType; seriesOrder?: number | null }) {
    const t = useTranslations("post");

    return (
        <div className="mt-4 mb-3 flex flex-wrap items-center gap-2 text-xs text-foreground/55">
            <span>{date}</span>
            <span aria-hidden="true">•</span>
            <span>{t("readingMinutes", { count: readingTime })}</span>
            <span aria-hidden="true">•</span>
            <PostLevelBadge level={level} />
            <span aria-hidden="true">•</span>
            <PostTypeBadge type={type} order={seriesOrder} />
        </div>
    );
}
