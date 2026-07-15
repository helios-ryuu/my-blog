"use client";

import { Edit2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "../common/SectionCard";
import type { AdminPost, AdminTag } from "@/types/admin";
import { useState } from "react";

interface EditSectionProps {
    posts: AdminPost[];
    tags: AdminTag[];
    onEditPost: (id: number) => void;
    onEditTag: (tag: AdminTag) => void;
}

export default function EditSection({ posts, tags, onEditPost, onEditTag }: EditSectionProps) {
    const t = useTranslations("admin");
    const [postId, setPostId] = useState<string>("");
    const [tagId, setTagId] = useState<string>("");

    return (
        <section>
            <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">
                {t("sectionEdit")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SectionCard
                    title={t("editPost")}
                    description={t("editPostDesc")}
                    icon={Edit2}
                    colorVariant="accent"
                    selectKey={posts.length}
                    selectValue={postId}
                    selectPlaceholder={posts.length ? t("selectPost") : t("noPosts")}
                    selectOptions={posts.map((p) => ({ value: p.id, label: p.title }))}
                    onSelectChange={setPostId}
                    selectDisabled={posts.length === 0}
                    buttonText={t("editPost")}
                    buttonDisabled={!postId}
                    onButtonClick={() => postId && onEditPost(Number(postId))}
                />
                <SectionCard
                    title={t("editTag")}
                    description={t("editTagDesc")}
                    icon={Edit2}
                    colorVariant="blue"
                    selectKey={tags.length}
                    selectValue={tagId}
                    selectPlaceholder={tags.length ? t("selectTag") : t("noTags")}
                    selectOptions={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
                    onSelectChange={setTagId}
                    selectDisabled={tags.length === 0}
                    buttonText={t("editTag")}
                    buttonDisabled={!tagId}
                    onButtonClick={() => {
                        const tag = tags.find((tag) => String(tag.id) === tagId);
                        if (tag) onEditTag(tag);
                    }}
                />
            </div>
        </section>
    );
}
