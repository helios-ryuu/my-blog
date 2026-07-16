"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "../common/SectionCard";
import PostAdvancedSelector from "../common/PostAdvancedSelector";
import TagAdvancedSelector from "../common/TagAdvancedSelector";
import SeriesAdvancedSelector from "../common/SeriesAdvancedSelector";
import type { AdminCategory, AdminPost, AdminSeries, AdminTag } from "@/types/admin";
import { useState } from "react";

export interface DeleteConfirmData {
    type: "post" | "tag" | "series";
    id: number;
    name: string;
    slug?: string;
    category?: string;
    published?: boolean;
    tags?: string[];
    postCount?: number;
}

interface DeleteSectionProps {
    tags: AdminTag[];
    categories: AdminCategory[];
    onDeleteConfirm: (data: DeleteConfirmData) => void;
}

export default function DeleteSection({ tags, categories, onDeleteConfirm }: DeleteSectionProps) {
    const t = useTranslations("admin");
    const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);
    const [selectedTag, setSelectedTag] = useState<AdminTag | null>(null);
    const [selectedSeries, setSelectedSeries] = useState<AdminSeries | null>(null);

    return (
        <section>
            <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">
                {t("sectionDelete")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <SectionCard
                    title={t("deletePost")}
                    description={t("deletePostDesc")}
                    icon={Trash2}
                    colorVariant="red"
                    buttonText={t("deletePost")}
                    buttonVariant="danger"
                    buttonDisabled={!selectedPost}
                    onButtonClick={() => {
                        if (!selectedPost) return;
                        onDeleteConfirm({
                            type: "post",
                            id: selectedPost.id,
                            name: selectedPost.title,
                            slug: selectedPost.slug,
                            category: selectedPost.category,
                            published: selectedPost.published,
                            tags: selectedPost.tags?.map((postTag) => postTag.name),
                        });
                    }}
                >
                    <PostAdvancedSelector value={selectedPost} tags={tags} categories={categories} onChange={setSelectedPost} />
                </SectionCard>
                <SectionCard
                    title={t("deleteSeries")}
                    description={selectedSeries?.post_count ? t("seriesDeleteBlocked", { count: selectedSeries.post_count }) : t("deleteSeriesDesc")}
                    icon={Trash2}
                    colorVariant="red"
                    buttonText={t("deleteSeries")}
                    buttonVariant="danger"
                    buttonDisabled={!selectedSeries || selectedSeries.post_count > 0}
                    onButtonClick={() => selectedSeries && onDeleteConfirm({ type: "series", id: selectedSeries.id, name: selectedSeries.name, slug: selectedSeries.slug, postCount: selectedSeries.post_count })}
                >
                    <SeriesAdvancedSelector value={selectedSeries} onChange={setSelectedSeries} />
                </SectionCard>
                <SectionCard
                    title={t("deleteTag")}
                    description={t("deleteTagDesc")}
                    icon={Trash2}
                    colorVariant="red"
                    buttonText={t("deleteTag")}
                    buttonVariant="danger"
                    buttonDisabled={!selectedTag}
                    onButtonClick={() => {
                        if (!selectedTag) return;
                        onDeleteConfirm({ type: "tag", id: selectedTag.id, name: selectedTag.name, slug: selectedTag.slug });
                    }}
                >
                    <TagAdvancedSelector value={selectedTag} tags={tags} onChange={setSelectedTag} />
                </SectionCard>
            </div>
        </section>
    );
}
