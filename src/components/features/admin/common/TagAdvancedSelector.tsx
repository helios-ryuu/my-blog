"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import EntityCombobox from "./EntityCombobox";
import type { AdminTag } from "@/types/admin";

const PAGE_SIZE = 12;

interface TagAdvancedSelectorProps {
    value: AdminTag | null;
    tags: AdminTag[];
    onChange: (tag: AdminTag | null) => void;
}

function matchesTag(tag: AdminTag, query: string) {
    if (!query) return true;
    const normalized = query.toLowerCase();
    return String(tag.id).includes(normalized)
        || tag.name.toLowerCase().includes(normalized)
        || Boolean(tag.slug?.toLowerCase().includes(normalized));
}

export default function TagAdvancedSelector({ value, tags, onChange }: TagAdvancedSelectorProps) {
    const t = useTranslations("admin");
    const [quickQuery, setQuickQuery] = useState("");
    const [advancedQuery, setAdvancedQuery] = useState("");
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [page, setPage] = useState(1);

    const quickTags = useMemo(
        () => tags.filter((tag) => matchesTag(tag, quickQuery.trim())).slice(0, 8),
        [quickQuery, tags],
    );
    const filteredTags = useMemo(
        () => tags.filter((tag) => matchesTag(tag, advancedQuery.trim())),
        [advancedQuery, tags],
    );
    const totalPages = Math.max(1, Math.ceil(filteredTags.length / PAGE_SIZE));
    const pageTags = filteredTags.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

    const selectTag = (tag: AdminTag) => {
        onChange(tag);
        setQuickQuery(tag.name);
        setIsAdvancedOpen(false);
    };

    return (
        <>
            <EntityCombobox
                query={quickQuery}
                onQueryChange={(next) => {
                    setQuickQuery(next);
                    if (value && next !== value.name) onChange(null);
                }}
                options={quickTags.map((tag) => ({
                    key: tag.id,
                    label: tag.name,
                    description: `#${tag.id} · /${tag.slug ?? ""}`,
                    item: tag,
                }))}
                onSelect={selectTag}
                onAdvanced={() => {
                    setAdvancedQuery(quickQuery);
                    setPage(1);
                    setIsAdvancedOpen(true);
                }}
                placeholder={t("selectTag")}
                advancedLabel={t("advancedTagSearch")}
                emptyLabel={t("noMatchingTags")}
                loadingLabel={t("searchingTags")}
            />

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
                        aria-labelledby="tag-picker-title"
                        className="flex max-h-[min(680px,calc(100dvh-24px))] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-(--border-color) bg-background shadow-2xl"
                    >
                        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-(--border-color) px-4 py-3">
                            <div>
                                <h2 id="tag-picker-title" className="text-base font-semibold text-foreground">{t("tagPickerTitle")}</h2>
                                <p className="mt-0.5 text-xs text-foreground/55">{t("tagPickerDescription")}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAdvancedOpen(false)}
                                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground/55 transition-colors hover:bg-foreground/10 hover:text-foreground"
                                aria-label={t("closeTagPicker")}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </header>

                        <div className="shrink-0 border-b border-(--border-color) p-4">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                                <input
                                    autoFocus
                                    value={advancedQuery}
                                    onChange={(event) => {
                                        setAdvancedQuery(event.target.value);
                                        setPage(1);
                                    }}
                                    placeholder={t("tagSearchPlaceholder")}
                                    className="h-10 w-full rounded-md border border-(--border-color) bg-background-hover/35 pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                                />
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {pageTags.length === 0 ? (
                                <div className="flex min-h-52 items-center justify-center px-4 text-center text-sm text-foreground/50">
                                    {t("noMatchingTags")}
                                </div>
                            ) : (
                                <div className="divide-y divide-(--border-color)">
                                    {pageTags.map((tag) => (
                                        <button
                                            type="button"
                                            key={tag.id}
                                            onClick={() => selectTag(tag)}
                                            className={`w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-accent/8 ${value?.id === tag.id ? "bg-accent/12" : ""}`}
                                        >
                                            <h3 className="text-sm font-semibold text-foreground">{tag.name}</h3>
                                            <p className="mt-1 font-mono text-xs text-foreground/45">#{tag.id} · /{tag.slug ?? ""}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-(--border-color) px-4 py-3">
                            <p className="text-xs text-foreground/50">{t("tagPickerResults", { count: filteredTags.length })}</p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    disabled={page <= 1}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-(--border-color) disabled:opacity-35"
                                    aria-label={t("previousPage")}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="min-w-20 text-center text-xs text-foreground/60">{t("pageOf", { page, total: totalPages })}</span>
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                    disabled={page >= totalPages}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-(--border-color) disabled:opacity-35"
                                    aria-label={t("nextPage")}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </footer>
                    </section>
                </div>
            )}
        </>
    );
}
