"use client";

import { useEffect, useMemo, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
    Search,
    X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Select from "@/components/ui/Select";
import EntityCombobox from "./EntityCombobox";
import { LEVELS, type AdminCategory, type AdminPost, type AdminTag } from "@/types/admin";
import { POST_LEVEL_LABEL_KEYS } from "@/types/database";

const PAGE_SIZE = 10;

interface PostAdvancedSelectorProps {
    value: AdminPost | null;
    tags: AdminTag[];
    categories: AdminCategory[];
    onChange: (post: AdminPost | null) => void;
}

function formatDate(value?: string | null) {
    if (!value) return null;
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export default function PostAdvancedSelector({ value, tags, categories, onChange }: PostAdvancedSelectorProps) {
    const t = useTranslations("admin");
    const tPost = useTranslations("post");
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [quickQuery, setQuickQuery] = useState("");
    const [debouncedQuickQuery, setDebouncedQuickQuery] = useState("");
    const [quickPosts, setQuickPosts] = useState<AdminPost[]>([]);
    const [isQuickLoading, setIsQuickLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [category, setCategory] = useState("");
    const [level, setLevel] = useState("");
    const [status, setStatus] = useState("");
    const [type, setType] = useState("");
    const [tag, setTag] = useState("");
    const [page, setPage] = useState(1);
    const [posts, setPosts] = useState<AdminPost[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const categoryOptions = useMemo(() => [
        { value: "", label: t("filterAll") },
        ...categories.map((item) => ({
            value: item.slug,
            label: item.icon ? `${item.icon} ${item.name}` : item.name,
        })),
    ], [categories, t]);
    const categoryNames = useMemo(
        () => new Map(categories.map((item) => [item.slug, item.icon ? `${item.icon} ${item.name}` : item.name])),
        [categories],
    );
    const levelOptions = useMemo(() => [
        { value: "", label: t("filterAll") },
        ...LEVELS.map((item) => ({ value: item, label: tPost(POST_LEVEL_LABEL_KEYS[item]) })),
    ], [t, tPost]);
    const statusOptions = useMemo(() => [
        { value: "", label: t("filterAll") },
        { value: "published", label: t("statusPublished") },
        { value: "draft", label: t("statusDraft") },
    ], [t]);
    const typeOptions = useMemo(() => [
        { value: "", label: t("filterAll") },
        { value: "standalone", label: t("typeStandalone") },
        { value: "series", label: t("typeSeries") },
    ], [t]);
    const tagOptions = useMemo(() => [
        { value: "", label: t("filterAll") },
        ...tags
            .filter((item): item is AdminTag & { slug: string } => Boolean(item.slug))
            .map((item) => ({ value: item.slug, label: item.name })),
    ], [t, tags]);

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedQuickQuery(quickQuery.trim()), 250);
        return () => window.clearTimeout(timeout);
    }, [quickQuery]);

    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({ page: "1", pageSize: "8" });
        if (debouncedQuickQuery) params.set("q", debouncedQuickQuery);

        async function loadQuickPosts() {
            setIsQuickLoading(true);
            try {
                const response = await fetch(`/api/admin/posts?${params}`, { signal: controller.signal });
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || t("loadError"));
                setQuickPosts(result.data.items ?? []);
            } catch (loadError) {
                if (!(loadError instanceof DOMException && loadError.name === "AbortError")) setQuickPosts([]);
            } finally {
                if (!controller.signal.aborted) setIsQuickLoading(false);
            }
        }

        loadQuickPosts();
        return () => controller.abort();
    }, [debouncedQuickQuery, t]);

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
        return () => window.clearTimeout(timeout);
    }, [query]);

    useEffect(() => {
        if (!isAdvancedOpen) return;
        const controller = new AbortController();
        const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
        if (debouncedQuery) params.set("q", debouncedQuery);
        if (category) params.set("category", category);
        if (level) params.set("level", level);
        if (status) params.set("status", status);
        if (type) params.set("type", type);
        if (tag) params.set("tag", tag);

        async function loadPosts() {
            setIsLoading(true);
            setError("");
            try {
                const response = await fetch(`/api/admin/posts?${params}`, { signal: controller.signal });
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || t("loadError"));
                setPosts(result.data.items ?? []);
                setTotal(result.data.total ?? 0);
            } catch (loadError) {
                if (loadError instanceof DOMException && loadError.name === "AbortError") return;
                setPosts([]);
                setTotal(0);
                setError(loadError instanceof Error ? loadError.message : t("loadError"));
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        }

        loadPosts();
        return () => controller.abort();
    }, [category, debouncedQuery, isAdvancedOpen, level, page, reloadKey, status, t, tag, type]);

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

    const updateFilter = (setter: (next: string) => void, next: string) => {
        setter(next);
        setPage(1);
    };

    const selectPost = (post: AdminPost) => {
        onChange(post);
        setQuickQuery(post.title);
        setIsAdvancedOpen(false);
    };

    return (
        <>
            <EntityCombobox
                query={quickQuery}
                onQueryChange={(next) => {
                    setQuickQuery(next);
                    if (value && next !== value.title) onChange(null);
                }}
                options={quickPosts.map((post) => ({
                    key: post.id,
                    label: post.title,
                    description: `#${post.id} · /${post.slug} · ${post.published ? t("statusPublished") : t("statusDraft")}`,
                    item: post,
                }))}
                onSelect={selectPost}
                onAdvanced={() => {
                    setQuery(quickQuery);
                    setPage(1);
                    setIsAdvancedOpen(true);
                }}
                placeholder={t("selectPost")}
                advancedLabel={t("advancedPostSearch")}
                emptyLabel={t("noMatchingPosts")}
                loadingLabel={t("searchingPosts")}
                isLoading={isQuickLoading}
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
                        aria-labelledby="post-picker-title"
                        className="flex max-h-[min(760px,calc(100dvh-24px))] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-(--border-color) bg-background shadow-2xl"
                    >
                        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-(--border-color) px-4 py-3">
                            <div>
                                <h2 id="post-picker-title" className="text-base font-semibold text-foreground">{t("postPickerTitle")}</h2>
                                <p className="mt-0.5 text-xs text-foreground/55">{t("postPickerDescription")}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAdvancedOpen(false)}
                                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground/55 transition-colors hover:bg-foreground/10 hover:text-foreground"
                                aria-label={t("closePostPicker")}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </header>

                        <div className="shrink-0 space-y-3 border-b border-(--border-color) p-4">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                                <input
                                    autoFocus
                                    value={query}
                                    onChange={(event) => {
                                        setQuery(event.target.value);
                                        setPage(1);
                                    }}
                                    placeholder={t("postSearchPlaceholder")}
                                    className="h-10 w-full rounded-md border border-(--border-color) bg-background-hover/35 pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                                />
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                                <div>
                                    <label className="mb-1 block text-xs text-foreground/55">{t("filterLevel")}</label>
                                    <Select value={level} onValueChange={(next) => updateFilter(setLevel, next)} options={levelOptions} className="h-9 w-full" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-foreground/55">{t("filterCategory")}</label>
                                    <Select value={category} onValueChange={(next) => updateFilter(setCategory, next)} options={categoryOptions} className="h-9 w-full" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-foreground/55">{t("filterStatus")}</label>
                                    <Select value={status} onValueChange={(next) => updateFilter(setStatus, next)} options={statusOptions} className="h-9 w-full" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-foreground/55">{t("filterType")}</label>
                                    <Select value={type} onValueChange={(next) => updateFilter(setType, next)} options={typeOptions} className="h-9 w-full" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-foreground/55">{t("filterTag")}</label>
                                    <Select value={tag} onValueChange={(next) => updateFilter(setTag, next)} options={tagOptions} className="h-9 w-full" />
                                </div>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-foreground/55">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("searchingPosts")}
                                </div>
                            ) : error ? (
                                <div className="flex min-h-52 flex-col items-center justify-center gap-3 px-4 text-center">
                                    <p className="text-sm text-red-500">{error}</p>
                                    <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="inline-flex items-center gap-2 rounded-md border border-(--border-color) px-3 py-1.5 text-sm hover:bg-foreground/5">
                                        <RefreshCw className="h-4 w-4" /> {t("retry")}
                                    </button>
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="flex min-h-52 items-center justify-center px-4 text-center text-sm text-foreground/50">
                                    {t("noMatchingPosts")}
                                </div>
                            ) : (
                                <div className="divide-y divide-(--border-color)">
                                    {posts.map((post) => (
                                        <button
                                            type="button"
                                            key={post.id}
                                            onClick={() => {
                                                selectPost(post);
                                            }}
                                            className={`w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-accent/8 ${value?.id === post.id ? "bg-accent/12" : ""}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate text-sm font-semibold text-foreground">{post.title}</h3>
                                                    <p className="mt-1 truncate font-mono text-xs text-foreground/45">#{post.id} · /{post.slug}</p>
                                                </div>
                                                <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${post.published ? "bg-green-500/15 text-green-500" : "bg-yellow-500/15 text-yellow-500"}`}>
                                                    {post.published ? t("statusPublished") : t("statusDraft")}
                                                </span>
                                            </div>
                                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground/60">{post.description}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-foreground/45">
                                                <span>{categoryNames.get(post.category) ?? post.category}</span>
                                                <span>{tPost(POST_LEVEL_LABEL_KEYS[post.level])}</span>
                                                <span>{tPost("readingMinutes", { count: post.reading_time })}</span>
                                                <span>{post.series_id ? `${t("typeSeries")} #${post.series_order}` : t("typeStandalone")}</span>
                                                {formatDate(post.updated_at ?? post.created_at) && <span>{formatDate(post.updated_at ?? post.created_at)}</span>}
                                                {post.tags?.map((postTag) => <span key={postTag.id}>#{postTag.name}</span>)}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-(--border-color) px-4 py-3">
                            <p className="text-xs text-foreground/50">{t("postPickerResults", { count: total })}</p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    disabled={page <= 1 || isLoading}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-(--border-color) disabled:opacity-35"
                                    aria-label={t("previousPage")}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="min-w-20 text-center text-xs text-foreground/60">{t("pageOf", { page, total: totalPages })}</span>
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                    disabled={page >= totalPages || isLoading}
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
