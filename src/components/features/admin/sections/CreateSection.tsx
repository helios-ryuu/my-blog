"use client";

import { BookOpen, FilePlus, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "../common/SectionCard";

interface CreateSectionProps {
    onAddPost: () => void;
    onAddTag: () => void;
    onAddSeries: () => void;
}

export default function CreateSection({ onAddPost, onAddTag, onAddSeries }: CreateSectionProps) {
    const t = useTranslations("admin");

    return (
        <section>
            <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">
                {t("sectionCreate")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <SectionCard
                    title={t("createPost")}
                    description={t("createPostDesc")}
                    icon={FilePlus}
                    onClick={onAddPost}
                    colorVariant="accent"
                />
                <SectionCard title={t("createSeries")} description={t("createSeriesDesc")} icon={BookOpen} onClick={onAddSeries} colorVariant="accent" />
                <SectionCard
                    title={t("createTag")}
                    description={t("createTagDesc")}
                    icon={Tag}
                    onClick={onAddTag}
                    colorVariant="blue"
                />
            </div>
        </section>
    );
}
