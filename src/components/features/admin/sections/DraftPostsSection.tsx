"use client";

import { useState } from "react";
import { Edit3, Clock, Send, Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { AdminPost } from "@/types/admin";

interface DraftPostsSectionProps {
    posts: AdminPost[];
    isLoading?: boolean;
    onEditDraft: (id: number) => void;
    onPublished?: () => void;
    onShowToast?: (type: "success" | "error" | "info" | "warning", message: string) => void;
}

export default function DraftPostsSection({
    posts,
    isLoading,
    onEditDraft,
    onPublished,
    onShowToast,
}: DraftPostsSectionProps) {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const drafts = posts.filter((p) => !p.published);
    const [publishingId, setPublishingId] = useState<number | null>(null);

    async function publishPost(id: number) {
        setPublishingId(id);
        try {
            const res = await fetch(`/api/admin/posts/${id}/publish`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ published: true }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Publish failed");
            onShowToast?.("success", t("publishPost"));
            onPublished?.();
        } catch (e) {
            onShowToast?.("error", e instanceof Error ? e.message : "Publish failed");
        } finally {
            setPublishingId(null);
        }
    }

    return (
        <section>
            <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Edit3 size={14} className="text-yellow-500" />
                {t("draftPosts")}
                {drafts.length > 0 && (
                    <span className="text-xs font-normal bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded">
                        {drafts.length}
                    </span>
                )}
            </h3>

            {isLoading ? (
                <div className="text-foreground/50 text-center py-8">{t("loadingDrafts")}</div>
            ) : drafts.length === 0 ? (
                <div className="text-foreground/50 text-center py-6 border border-dashed border-(--border-color) rounded-lg text-sm">
                    {t("noDraftPosts")}
                </div>
            ) : (
                <div className="grid gap-2">
                    {drafts.map((draft) => (
                        <div
                            key={draft.id}
                            className="p-3 rounded-lg border border-(--border-color) bg-yellow-500/5 hover:border-yellow-500/40 transition-colors flex items-center gap-3"
                        >
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-foreground/10 shrink-0 relative">
                                {draft.image_url && (
                                    <Image
                                        src={draft.image_url}
                                        alt={draft.title}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground text-sm truncate">
                                    {draft.title}
                                </h4>
                                <div className="flex items-center gap-3 text-xs text-foreground/40 mt-0.5">
                                    <span className="flex items-center gap-1">
                                        <Clock size={11} />
                                        {draft.updated_at
                                            ? new Date(draft.updated_at).toLocaleDateString()
                                            : draft.created_at
                                                ? new Date(draft.created_at).toLocaleDateString()
                                                : "—"}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-foreground/10 text-foreground/50">
                                        {draft.category}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    onClick={() => onEditDraft(draft.id)}
                                    className="px-2.5 py-1.5 text-xs rounded-md border border-(--border-color) bg-foreground/5 hover:bg-foreground/10 transition-colors cursor-pointer text-foreground/70 hover:text-foreground"
                                >
                                    {tCommon("edit")}
                                </button>
                                <button
                                    onClick={() => publishPost(draft.id)}
                                    disabled={publishingId === draft.id}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md bg-accent text-white hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {publishingId === draft.id ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <Send size={12} />
                                    )}
                                    {t("publishPost")}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
