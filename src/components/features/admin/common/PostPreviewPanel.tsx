"use client";

import { Eye, Loader2 } from "lucide-react";
import Image from "next/image";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { mdxComponents } from "@/../mdx-components";
import type { AdminSeries, AdminTag } from "@/types/admin";
import {
    type DbCategory,
    type PostCategory,
    type PostLevel,
    type PostType,
} from "@/types/database";
import PostLevelBadge from "@/components/features/post/card/PostLevelBadge";
import PostCategoryBadge from "@/components/features/post/card/PostCategoryBadge";
import { useTranslations } from "next-intl";
import PostTypeBadge from "@/components/features/post/card/PostTypeBadge";

interface PostPreviewPanelProps {
    title: string;
    description: string;
    imageUrl: string;
    category: PostCategory | "";
    categoryInfo?: DbCategory;
    level: PostLevel;
    readingTime: number;
    type: PostType;
    series?: AdminSeries;
    seriesOrder?: number | null;
    selectedTags: number[];
    tags: AdminTag[];
    mdxSource: MDXRemoteSerializeResult | null;
    isRendering?: boolean;
}

export function PostPreviewPanel({
    title,
    description,
    imageUrl,
    category,
    categoryInfo,
    level,
    readingTime,
    type,
    series,
    seriesOrder,
    selectedTags,
    tags,
    mdxSource,
    isRendering,
}: PostPreviewPanelProps) {
    const t = useTranslations("admin");
    const tPost = useTranslations("post");
    return (
        <div className="flex-1 min-w-0 h-full flex flex-col bg-background">
            <div className="flex items-center gap-2 p-4 border-b border-(--border-color) text-foreground/70">
                <Eye size={18} />
                <span className="font-semibold text-lg">{t("previewTitle")}</span>
                {isRendering && (
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-foreground/50">
                        <Loader2 size={12} className="animate-spin" />
                        {t("previewRendering")}
                    </span>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">{title || t("previewUntitled")}</h1>
                    <p className="text-sm mt-2 text-foreground/70">{description || t("previewNoDescription")}</p>
                    <div className="flex flex-wrap items-center gap-2 text-foreground/50 text-sm mt-4 mb-3">
                        {category && (
                            <PostCategoryBadge category={category} name={categoryInfo?.name} icon={categoryInfo?.icon} />
                        )}
                        <PostLevelBadge level={level} />
                        <PostTypeBadge type={type} order={seriesOrder} />
                        <span>{tPost("readingMinutes", { count: readingTime })}</span>
                    </div>
                    {type === "series" && series && (
                        <p className="mb-3 text-xs text-foreground/55">{series.name}</p>
                    )}
                    {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {selectedTags.map((tagId) => {
                                const tag = tags.find((t) => t.id === tagId);
                                return tag ? (
                                    <span
                                        key={tag.id}
                                        className="px-2.5 py-0.5 text-xs rounded-[4px] bg-accent/20 text-accent"
                                    >
                                        {tag.name}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    )}
                </header>

                {imageUrl && (
                    <div className="mb-6 rounded-lg overflow-hidden border border-(--border-color)">
                        <Image
                            src={imageUrl}
                            alt={title}
                            width={0}
                            height={0}
                            sizes="100vw"
                            className="w-full h-auto object-cover"
                            unoptimized
                        />
                    </div>
                )}

                <div className="prose prose-invert max-w-none">
                    {mdxSource ? (
                        <MDXRemote {...mdxSource} components={mdxComponents} />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-foreground/40 italic gap-2">
                            <p>{t("previewEmpty")}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
