"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "../common/SectionCard";
import type { AdminPost, AdminTag } from "@/types/admin";
import { useState } from "react";

export interface DeleteConfirmData {
    type: "post" | "tag";
    id: number;
    name: string;
    slug?: string;
    category?: string;
    published?: boolean;
    tags?: string[];
}

interface DeleteSectionProps {
    posts: AdminPost[];
    tags: AdminTag[];
    onDeleteConfirm: (data: DeleteConfirmData) => void;
}

export default function DeleteSection({ posts, tags, onDeleteConfirm }: DeleteSectionProps) {
    const t = useTranslations("admin");
    const [postId, setPostId] = useState<string>("");
    const [tagId, setTagId] = useState<string>("");

    return (
        <section>
            <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">
                {t("sectionDelete")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SectionCard
                    title={t("deletePost")}
                    description={t("deletePostDesc")}
                    icon={Trash2}
                    colorVariant="red"
                    selectKey={posts.length}
                    selectValue={postId}
                    selectPlaceholder={posts.length ? t("selectPost") : t("noPosts")}
                    selectOptions={posts.map((p) => ({ value: p.id, label: p.title }))}
                    onSelectChange={setPostId}
                    selectDisabled={posts.length === 0}
                    buttonText={t("deletePost")}
                    buttonVariant="danger"
                    buttonDisabled={!postId}
                    onButtonClick={() => {
                        const p = posts.find((x) => x.id === Number(postId));
                        if (!p) return;
                        onDeleteConfirm({
                            type: "post",
                            id: p.id,
                            name: p.title,
                            slug: p.slug,
                            category: p.category,
                            published: p.published,
                            tags: p.tags,
                        });
                    }}
                />
                <SectionCard
                    title={t("deleteTag")}
                    description={t("deleteTagDesc")}
                    icon={Trash2}
                    colorVariant="red"
                    selectKey={tags.length}
                    selectValue={tagId}
                    selectPlaceholder={tags.length ? t("selectTag") : t("noTags")}
                    selectOptions={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
                    onSelectChange={setTagId}
                    selectDisabled={tags.length === 0}
                    buttonText={t("deleteTag")}
                    buttonVariant="danger"
                    buttonDisabled={!tagId}
                    onButtonClick={() => {
                        const tag = tags.find((x) => x.id === Number(tagId));
                        if (!tag) return;
                        onDeleteConfirm({ type: "tag", id: tag.id, name: tag.name, slug: tag.slug });
                    }}
                />
            </div>
        </section>
    );
}
