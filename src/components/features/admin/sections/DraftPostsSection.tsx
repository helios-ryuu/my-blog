"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Clock, Send, Loader2, Search, X, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { AdminCategory, AdminPost } from "@/types/admin";
import PostLevelBadge from "@/components/features/post/card/PostLevelBadge";
import PostTypeBadge from "@/components/features/post/card/PostTypeBadge";

const PAGE_SIZE = 6;

interface DraftPostsSectionProps {
    posts: AdminPost[];
    categories: AdminCategory[];
    isLoading?: boolean;
    onEditDraft: (id: number) => void;
    onPublished?: () => void;
    onShowToast?: (type: "success" | "error" | "info" | "warning", message: string) => void;
}

export default function DraftPostsSection({
    posts,
    categories,
    isLoading,
    onEditDraft,
    onPublished,
    onShowToast,
}: DraftPostsSectionProps) {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const drafts = useMemo(() => posts.filter((p) => !p.published), [posts]);
    const [publishingId, setPublishingId] = useState<number | null>(null);

    // Advanced search modal state
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        const normalized = query.trim().toLocaleLowerCase();
        return drafts.filter((draft) => {
            if (selectedCategory && draft.category !== selectedCategory) return false;
            if (!normalized) return true;
            return (
                draft.title?.toLocaleLowerCase().includes(normalized) ||
                draft.slug?.toLocaleLowerCase().includes(normalized) ||
                draft.description?.toLocaleLowerCase().includes(normalized)
            );
        });
    }, [drafts, query, selectedCategory]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageDrafts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    useEffect(() => {
        if (!isAdvancedOpen) return;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsAdvancedOpen(false);
        };
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [isAdvancedOpen]);

    const openAdvancedWithQuery = (q: string = "") => {
        setQuery(q);
        setSelectedCategory("");
        setPage(1);
        setIsAdvancedOpen(true);
    };

    async function publishPost(id: number) {
        setPublishingId(id);
        try {
            const res = await fetch(`/api/admin/posts/${id}/publish`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ published: true }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || t("publishError"));
            onShowToast?.("success", t("publishPost"));
            onPublished?.();
        } catch (e) {
            onShowToast?.("error", e instanceof Error ? e.message : t("publishError"));
        } finally {
            setPublishingId(null);
        }
    }

    return (
        <section className="space-y-3 pt-2">
            {/* Header with Title & Action buttons */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Edit3 size={15} className="text-yellow-500" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                        {t("draftPosts")}
                    </h3>
                    <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-yellow-600 dark:text-yellow-400">
                        {drafts.length}
                    </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => openAdvancedWithQuery("")}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-color) bg-background px-3 text-xs font-medium text-foreground/75 hover:border-yellow-500 hover:text-foreground hover:bg-yellow-500/5 transition-colors cursor-pointer"
                    >
                        <Search size={13} className="text-foreground/50" />
                        <span>{t("advancedDraftSearch")}</span>
                    </button>
                </div>
            </div>

            {/* 1-Line Draft Summary & Pill Row */}
            <div className="flex items-center gap-2 overflow-x-auto rounded-lg border border-(--border-color)/80 bg-background/40 p-2.5 scrollbar-thin">
                <span className="shrink-0 text-xs font-semibold text-foreground/70">
                    {t("draftSummary", { count: drafts.length })}:
                </span>

                {isLoading ? (
                    <span className="text-xs text-foreground/50 italic flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" />
                        {t("loadingDrafts")}
                    </span>
                ) : drafts.length === 0 ? (
                    <span className="text-xs text-foreground/50 italic">
                        {t("noDraftPosts")}
                    </span>
                ) : (
                    drafts.map((draft) => (
                        <div
                            key={draft.id}
                            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-(--border-color) bg-background px-2.5 py-1 text-xs text-foreground/85 hover:border-yellow-500/60 hover:bg-yellow-500/5 transition-all group shadow-2xs"
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                            <span
                                className="font-medium max-w-40 truncate cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-400"
                                onClick={() => onEditDraft(draft.id)}
                                title={draft.title}
                            >
                                {draft.title}
                            </span>
                            <span className="rounded-full bg-foreground/10 px-1.5 py-0.2 text-[10px] font-mono text-foreground/55">
                                {categories.find((c) => c.slug === draft.category)?.name ?? draft.category}
                            </span>
                            <button
                                type="button"
                                onClick={() => onEditDraft(draft.id)}
                                className="text-[11px] font-medium text-foreground/60 hover:text-foreground cursor-pointer px-1 py-0.5 rounded hover:bg-foreground/10 transition-colors"
                            >
                                {tCommon("edit")}
                            </button>
                            <button
                                type="button"
                                onClick={() => publishPost(draft.id)}
                                disabled={publishingId === draft.id}
                                className="text-[11px] font-medium text-accent hover:underline cursor-pointer disabled:opacity-50"
                            >
                                {publishingId === draft.id ? (
                                    <Loader2 size={11} className="animate-spin inline" />
                                ) : (
                                    t("publishPost")
                                )}
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Advance Search Dialog */}
            {isAdvancedOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setIsAdvancedOpen(false);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="draft-picker-title"
                        className="flex max-h-[min(680px,calc(100dvh-24px))] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-(--border-color) bg-background shadow-2xl"
                    >
                        {/* Modal Header */}
                        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-(--border-color) px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-md bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
                                    <Edit3 size={18} />
                                </div>
                                <div>
                                    <h2 id="draft-picker-title" className="text-base font-semibold text-foreground">
                                        {t("draftPickerTitle")}
                                    </h2>
                                    <p className="mt-0.5 text-xs text-foreground/55">
                                        {t("draftPickerDescription")}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAdvancedOpen(false)}
                                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground/55 transition-colors hover:bg-foreground/10 hover:text-foreground"
                                aria-label={t("closeDraftPicker")}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </header>

                        {/* Search & Filter Bar */}
                        <div className="shrink-0 border-b border-(--border-color) p-4 flex flex-col sm:flex-row gap-2.5">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                                <input
                                    autoFocus
                                    value={query}
                                    onChange={(event) => {
                                        setQuery(event.target.value);
                                        setPage(1);
                                    }}
                                    placeholder={t("draftSearchPlaceholder")}
                                    className="h-10 w-full rounded-md border border-(--border-color) bg-background-hover/35 pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                                />
                            </div>

                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setPage(1);
                                }}
                                className="h-10 rounded-md border border-(--border-color) bg-background px-3 text-xs text-foreground/80 outline-none focus:border-accent"
                            >
                                <option value="">{t("filterAll")} ({categories.length})</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.slug}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Draft List */}
                        <div className="min-h-52 flex-1 overflow-y-auto">
                            {pageDrafts.length === 0 ? (
                                <div className="flex min-h-52 items-center justify-center px-4 text-center text-sm text-foreground/50">
                                    {t("noMatchingDrafts")}
                                </div>
                            ) : (
                                <div className="divide-y divide-(--border-color)">
                                    {pageDrafts.map((draft) => (
                                        <div
                                            key={draft.id}
                                            className="flex items-center justify-between gap-3 p-3 sm:p-4 hover:bg-yellow-500/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="w-12 h-12 rounded-md overflow-hidden bg-foreground/10 shrink-0 relative flex items-center justify-center">
                                                    {draft.image_url ? (
                                                        <Image
                                                            src={draft.image_url}
                                                            alt={draft.title}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <BookOpen size={18} className="text-foreground/30" />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h4
                                                        className="font-medium text-foreground text-sm truncate cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-400"
                                                        onClick={() => {
                                                            setIsAdvancedOpen(false);
                                                            onEditDraft(draft.id);
                                                        }}
                                                    >
                                                        {draft.title}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/45 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={11} />
                                                            {draft.updated_at
                                                                ? new Date(draft.updated_at).toLocaleDateString()
                                                                : draft.created_at
                                                                    ? new Date(draft.created_at).toLocaleDateString()
                                                                    : "—"}
                                                        </span>
                                                        <span className="px-1.5 py-0.2 rounded text-[10px] uppercase bg-foreground/10 text-foreground/60">
                                                            {categories.find((c) => c.slug === draft.category)?.name ?? draft.category}
                                                        </span>
                                                        <PostLevelBadge level={draft.level} />
                                                        <PostTypeBadge type={draft.type} order={draft.series_order} compact />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAdvancedOpen(false);
                                                        onEditDraft(draft.id);
                                                    }}
                                                    className="px-2.5 py-1.5 text-xs rounded-md border border-(--border-color) bg-background hover:bg-foreground/5 transition-colors cursor-pointer text-foreground/80 hover:text-foreground"
                                                >
                                                    {tCommon("edit")}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => publishPost(draft.id)}
                                                    disabled={publishingId === draft.id}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md bg-accent text-white hover:bg-accent/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {publishingId === draft.id ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <Send size={12} />
                                                    )}
                                                    <span>{t("publishPost")}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer with Pagination */}
                        <footer className="flex shrink-0 items-center justify-between border-t border-(--border-color) px-4 py-3 text-xs text-foreground/60">
                            <span>
                                {filtered.length} {t("draftPosts").toLowerCase()}
                            </span>
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-(--border-color) bg-background hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className="px-1 text-[11px] font-mono">
                                        {page} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-(--border-color) bg-background hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </footer>
                    </section>
                </div>
            )}
        </section>
    );
}
