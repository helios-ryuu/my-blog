"use client";

import { useMemo, useState } from "react";
import { FolderTree, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AdminCategory } from "@/types/admin";
import CategoryForm from "../forms/CategoryForm";
import ConfirmPopup from "../common/ConfirmPopup";
import { Button } from "../common/Button";

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
    const [query, setQuery] = useState("");
    const [formCategory, setFormCategory] = useState<AdminCategory | null | undefined>();
    const [deleteCategory, setDeleteCategory] = useState<AdminCategory | null>(null);

    const filtered = useMemo(() => {
        const normalized = query.trim().toLocaleLowerCase();
        if (!normalized) return categories;
        return categories.filter((category) =>
            [category.name, category.slug, category.description, category.examples]
                .some((value) => value.toLocaleLowerCase().includes(normalized)),
        );
    }, [categories, query]);

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

    return (
        <section className="border-y border-(--border-color) py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-accent" />
                        <h3 className="text-sm font-semibold uppercase tracking-widest">{t("categoriesTitle")}</h3>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/60">{t("categoriesDescription")}</p>
                </div>
                <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setFormCategory(null)}>
                    {t("addCategory")}
                </Button>
            </div>

            <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("categorySearchPlaceholder")}
                    className="h-9 w-full rounded border border-(--border-color) bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent"
                />
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-(--border-color)">
                {isLoading ? (
                    <p className="p-6 text-center text-sm text-foreground/50">{t("loadingCategories")}</p>
                ) : filtered.length === 0 ? (
                    <p className="p-6 text-center text-sm text-foreground/50">{t("noCategories")}</p>
                ) : (
                    <div className="divide-y divide-(--border-color)">
                        {filtered.map((category) => (
                            <div key={category.id} className="grid gap-3 p-3 sm:grid-cols-[minmax(11rem,0.8fr)_minmax(14rem,1.2fr)_auto] sm:items-center">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        {category.icon && <span className="text-lg" aria-hidden="true">{category.icon}</span>}
                                        <span className="truncate text-sm font-semibold">{category.name}</span>
                                        <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                                            {t("categoryPostCount", { count: category.post_count })}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 truncate font-mono text-[11px] text-foreground/45">/{category.slug}</p>
                                </div>
                                <div className="min-w-0 text-xs text-foreground/65">
                                    <p className="truncate">{category.description}</p>
                                    {category.examples && <p className="mt-0.5 truncate text-foreground/40">{category.examples}</p>}
                                </div>
                                <div className="flex items-center justify-end gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setFormCategory(category)}
                                        title={t("editCategory")}
                                        aria-label={t("editCategory")}
                                        className="rounded p-2 text-foreground/55 transition-colors hover:bg-foreground/10 hover:text-foreground"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteCategory(category)}
                                        disabled={category.post_count > 0}
                                        title={category.post_count > 0 ? t("categoryDeleteBlocked", { count: category.post_count }) : t("deleteCategory")}
                                        aria-label={t("deleteCategory")}
                                        className="rounded p-2 text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
