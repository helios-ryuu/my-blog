"use client";

import { Edit2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "../common/SectionCard";
import PostAdvancedSelector from "../common/PostAdvancedSelector";
import TagAdvancedSelector from "../common/TagAdvancedSelector";
import SeriesAdvancedSelector from "../common/SeriesAdvancedSelector";
import type { AdminCategory, AdminPost, AdminSeries, AdminTag } from "@/types/admin";
import { useState } from "react";

interface EditSectionProps {
    tags: AdminTag[];
    categories: AdminCategory[];
    onEditPost: (id: number) => void;
    onEditTag: (tag: AdminTag) => void;
    onEditSeries: (series: AdminSeries) => void;
}

export default function EditSection({ tags, categories, onEditPost, onEditTag, onEditSeries }: EditSectionProps) {
    const t = useTranslations("admin");
    const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);
    const [selectedTag, setSelectedTag] = useState<AdminTag | null>(null);
    const [selectedSeries, setSelectedSeries] = useState<AdminSeries | null>(null);

    return (
        <section>
            <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">
                {t("sectionEdit")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <SectionCard
                    title={t("editPost")}
                    description={t("editPostDesc")}
                    icon={Edit2}
                    colorVariant="accent"
                    buttonText={t("editPost")}
                    buttonDisabled={!selectedPost}
                    onButtonClick={() => selectedPost && onEditPost(selectedPost.id)}
                >
                    <PostAdvancedSelector value={selectedPost} tags={tags} categories={categories} onChange={setSelectedPost} />
                </SectionCard>
                <SectionCard title={t("editSeries")} description={t("editSeriesDesc")} icon={Edit2} colorVariant="accent" buttonText={t("editSeries")} buttonDisabled={!selectedSeries} onButtonClick={() => selectedSeries && onEditSeries(selectedSeries)}>
                    <SeriesAdvancedSelector value={selectedSeries} onChange={setSelectedSeries} />
                </SectionCard>
                <SectionCard
                    title={t("editTag")}
                    description={t("editTagDesc")}
                    icon={Edit2}
                    colorVariant="blue"
                    buttonText={t("editTag")}
                    buttonDisabled={!selectedTag}
                    onButtonClick={() => selectedTag && onEditTag(selectedTag)}
                >
                    <TagAdvancedSelector value={selectedTag} tags={tags} onChange={setSelectedTag} />
                </SectionCard>
            </div>
        </section>
    );
}
