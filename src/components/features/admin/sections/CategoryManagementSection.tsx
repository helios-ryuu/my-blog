"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FolderTree, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AdminCategory } from "@/types/admin";
import CategoryForm from "../forms/CategoryForm";
import ConfirmPopup from "../common/ConfirmPopup";
import { Button } from "../common/Button";

const PAGE_SIZE = 8;

interface CategoryManagementSectionProps {
    categories: AdminCategory[];
    isLoading: boolean;
    onRefresh: () => void;
    onShowToast: (type: "success" | "error" | "info" | "warning", message: string) => void;
}

export default function CategoryManagementSection({
    categories,
    isLoading,
    onRefresh,
    onShowToast,
}: CategoryManagementSectionProps) {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [formCategory, setFormCategory] = useState<AdminCategory | null | undefined>();
    const [deleteCategory, setDeleteCategory] = useState<AdminCategory | null>(null);

    const totalPostsCount = useMemo(
        () => categories.reduce((sum, c) => sum + (c.post_count || 0), 0),
        [categories],
    );

    const filtered = useMemo(() => {
        const normalized = query.trim().toLocaleLowerCase();
        if (!normalized) return categories;
        return categories.filter((category) =>
            [category.name, category.slug, category.description, category.examples]
                .some((value) => value?.toLocaleLowerCase().includes(normalized)),
        );
    }, [categories, query]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageCategories = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

    async function confirmDelete() {
        if (!deleteCategory) return;
        try {
            const response = await fetch(`/api/admin/categories/${deleteCategory.id}`, { method: "DELETE" });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || t("categoryDeleteError"));
            onShowToast("success", t("categoryDeleteSuccess", { name: deleteCategory.name }));
            setDeleteCategory(null);
            onRefresh();
        } catch (cause) {
            onShowToast("error", cause instanceof Error ? cause.message : t("categoryDeleteError"));
        }
    }

    const openAdvancedWithQuery = (q: string = "") => {
        setQuery(q);
        setPage(1);
        setIsAdvancedOpen(true);
    };

    return (
        <section className="space-y-3 pt-2">
            {/* Header with Title & Action buttons */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-accent" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                            {t("categoriesTitle")}
                        </h3>
                        <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                            {t("categorySummaryWithPosts", {
                                categoriesCount: categories.length,
                                postsCount: totalPostsCount,
                            })}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-foreground/60 leading-relaxed">
                        {t("categoriesDescription")}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => openAdvancedWithQuery("")}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-color) bg-background px-3 text-xs font-medium text-foreground/75 hover:border-accent hover:text-foreground hover:bg-accent/5 transition-colors cursor-pointer"
                    >
                        <Search size={13} className="text-foreground/50" />
                        <span>{t("advancedCategorySearch")}</span>
                    </button>
                    <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus size={14} />}
                        onClick={() => setFormCategory(null)}
                    >
                        {t("addCategory")}
                    </Button>
                </div>
            </div>

            {/* 1-Line Category Summary & Pill Row */}
            <div className="flex items-center gap-2 overflow-x-auto rounded-lg border border-(--border-color)/80 bg-background/40 p-2.5 scrollbar-thin">
                <span className="shrink-0 text-xs font-semibold text-foreground/70">
                    {t("categorySummary", { count: categories.length })}:
                </span>

                {isLoading ? (
                    <span className="text-xs text-foreground/50 italic flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" />
                        {t("loadingCategories")}
                    </span>
                ) : categories.length === 0 ? (
                    <span className="text-xs text-foreground/50 italic">
                        {t("noCategories")}
                    </span>
                ) : (
                    categories.map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => openAdvancedWithQuery(category.name)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-(--border-color) bg-background px-2.5 py-1 text-xs text-foreground/80 hover:border-accent hover:bg-accent/10 hover:text-foreground transition-all cursor-pointer group shadow-2xs"
                            title={`${category.name}${category.description ? ` · ${category.description}` : ""}`}
                        >
                            {category.icon && <span className="text-xs leading-none">{category.icon}</span>}
                            <span className="font-medium">{category.name}</span>
                            <span className="rounded-full bg-foreground/10 px-1.5 py-0.2 text-[10px] font-mono text-foreground/55 group-hover:bg-accent/20 group-hover:text-accent">
                                {category.post_count}
                            </span>
                        </button>
                    ))
                )}

                <button
                    type="button"
                    onClick={() => openAdvancedWithQuery("")}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-dashed border-(--border-color) bg-foreground/5 px-2.5 py-1 text-xs text-foreground/60 hover:border-accent hover:text-accent transition-colors cursor-pointer"
                >
                    <Search size={12} />
                    <span>{t("advancedCategorySearch")}</span>
                </button>
            </div>

            {/* Advance Search Dialog (matching post, tag, and series pickers) */}
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
                        aria-labelledby="category-picker-title"
                        className="flex max-h-[min(680px,calc(100dvh-24px))] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-(--border-color) bg-background shadow-2xl"
                    >
                        {/* Modal Header */}
                        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-(--border-color) px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-md bg-accent/15 text-accent">
                                    <FolderTree size={18} />
                                </div>
                                <div>
                                    <h2 id="category-picker-title" className="text-base font-semibold text-foreground">
                                        {t("categoryPickerTitle")}
                                    </h2>
                                    <p className="mt-0.5 text-xs text-foreground/55">
                                        {t("categoryPickerDescription")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    icon={<Plus size={14} />}
                                    onClick={() => setFormCategory(null)}
                                >
                                    {t("addCategory")}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setIsAdvancedOpen(false)}
                                    className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground/55 transition-colors hover:bg-foreground/10 hover:text-foreground"
                                    aria-label={t("closeCategoryPicker")}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </header>

                        {/* Search Input */}
                        <div className="shrink-0 border-b border-(--border-color) p-4">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                                <input
                                    autoFocus
                                    value={query}
                                    onChange={(event) => {
                                        setQuery(event.target.value);
                                        setPage(1);
                                    }}
                                    placeholder={t("categorySearchPlaceholder")}
                                    className="h-10 w-full rounded-md border border-(--border-color) bg-background-hover/35 pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                                />
                            </div>
                        </div>

                        {/* Category List */}
                        <div className="min-h-52 flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-foreground/55">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("loadingCategories")}
                                </div>
                            ) : pageCategories.length === 0 ? (
                                <div className="flex min-h-52 items-center justify-center px-4 text-center text-sm text-foreground/50">
                                    {t("noCategories")}
                                </div>
                            ) : (
                                <div className="divide-y divide-(--border-color)">
                                    {pageCategories.map((category) => (
                                        <div
                                            key={category.id}
                                            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent/5"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    {category.icon && (
                                                        <span className="text-lg leading-none" aria-hidden="true">
                                                            {category.icon}
                                                        </span>
                                                    )}
                                                    <h3 className="truncate text-sm font-semibold text-foreground">
                                                        {category.name}
                                                    </h3>
                                                    <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                                                        {t("categoryPostCount", { count: category.post_count })}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 truncate font-mono text-[11px] text-foreground/45">
                                                    /{category.slug}
                                                </p>
                                                {category.description && (
                                                    <p className="mt-1 text-xs text-foreground/65 line-clamp-2">
                                                        {category.description}
                                                    </p>
                                                )}
                                                {category.examples && (
                                                    <p className="mt-0.5 text-[11px] text-foreground/40 line-clamp-1">
                                                        {category.examples}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormCategory(category)}
                                                    title={t("editCategory")}
                                                    aria-label={t("editCategory")}
                                                    className="inline-flex items-center gap-1 rounded-md border border-(--border-color) bg-foreground/5 px-2.5 py-1.5 text-xs text-foreground/75 transition-colors hover:bg-foreground/10 hover:text-foreground cursor-pointer"
                                                >
                                                    <Pencil size={13} />
                                                    <span>{tCommon("edit")}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteCategory(category)}
                                                    disabled={category.post_count > 0}
                                                    title={category.post_count > 0 ? t("categoryDeleteBlocked", { count: category.post_count }) : t("deleteCategory")}
                                                    aria-label={t("deleteCategory")}
                                                    className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                                                >
                                                    <Trash2 size={13} />
                                                    <span>{tCommon("delete")}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer with Results Count & Pagination */}
                        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-(--border-color) px-4 py-3">
                            <p className="text-xs text-foreground/50">
                                {t("categoryPickerResults", { count: filtered.length })}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    disabled={page <= 1}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-(--border-color) disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                                    aria-label={t("previousPage")}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="min-w-20 text-center text-xs text-foreground/60">
                                    {t("pageOf", { page, total: totalPages })}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                    disabled={page >= totalPages}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-(--border-color) disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                                    aria-label={t("nextPage")}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </footer>
                    </section>
                </div>
            )}

            {/* Category Edit/Create Modal */}
            {formCategory !== undefined && (
                <CategoryForm
                    category={formCategory}
                    onSuccess={() => {
                        onShowToast("success", t(formCategory ? "categoryUpdateSuccess" : "categoryCreateSuccess"));
                        onRefresh();
                    }}
                    onClose={() => setFormCategory(undefined)}
                />
            )}

            {/* Confirm Delete Dialog */}
            {deleteCategory && (
                <ConfirmPopup
                    variant="danger"
                    title={t("deleteCategory")}
                    message={t("deleteCategoryMessage")}
                    itemName={deleteCategory.name}
                    confirmText={t("deleteCategory")}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteCategory(null)}
                />
            )}
        </section>
    );
}
