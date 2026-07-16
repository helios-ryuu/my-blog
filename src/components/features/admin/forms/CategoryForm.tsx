"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { slugify } from "@/hooks/usePostFormValidation";
import type { AdminCategory } from "@/types/admin";
import { Button } from "../common/Button";
import { FormField, FormInput, FormMessage, FormTextarea } from "../common/FormFields";

interface CategoryFormProps {
    category?: AdminCategory | null;
    onSuccess: () => void;
    onClose: () => void;
}

export default function CategoryForm({ category, onSuccess, onClose }: CategoryFormProps) {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const [name, setName] = useState(category?.name ?? "");
    const [slug, setSlug] = useState(category?.slug ?? "");
    const [icon, setIcon] = useState(category?.icon ?? "");
    const [description, setDescription] = useState(category?.description ?? "");
    const [examples, setExamples] = useState(category?.examples ?? "");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const close = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isLoading) onClose();
        };
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, [isLoading, onClose]);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        const finalSlug = slug.trim() || slugify(name);
        if (!name.trim() || !description.trim()) {
            setError(t("categoryRequiredFields"));
            return;
        }
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)) {
            setError(t("categorySlugInvalid"));
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(category ? `/api/admin/categories/${category.id}` : "/api/admin/categories", {
                method: category ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    slug: finalSlug,
                    icon: icon.trim() || null,
                    description: description.trim(),
                    examples: examples.trim(),
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || t("categorySaveError"));
            onSuccess();
            onClose();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("categorySaveError"));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !isLoading && onClose()}>
            <div className="w-full max-w-xl rounded-lg border border-(--border-color) bg-background p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{category ? t("editCategoryTitle") : t("addCategoryTitle")}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        aria-label={tCommon("close")}
                        className="text-foreground/60 transition-colors hover:text-foreground disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-[5rem_1fr]">
                        <FormField label={t("categoryIcon")} hint={t("categoryIconHint")}>
                            <FormInput
                                name="icon"
                                value={icon}
                                maxLength={16}
                                onChange={(event) => setIcon(event.target.value)}
                                autoFocus
                            />
                        </FormField>
                        <FormField label={t("categoryName")} required>
                            <FormInput
                                name="name"
                                value={name}
                                maxLength={80}
                                onChange={(event) => {
                                    setName(event.target.value);
                                    if (!category && (!slug || slug === slugify(name))) setSlug(slugify(event.target.value));
                                }}
                            />
                        </FormField>
                    </div>

                    <FormField label={t("fieldSlug")} required hint={t("slugFieldHint")}>
                        <FormInput name="slug" value={slug} maxLength={100} onChange={(event) => setSlug(event.target.value)} />
                    </FormField>

                    <FormField label={t("categoryPurpose")} required>
                        <FormTextarea
                            name="description"
                            value={description}
                            rows={2}
                            maxLength={300}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                    </FormField>

                    <FormField label={t("categoryExamples")} hint={t("categoryExamplesHint")}>
                        <FormInput name="examples" value={examples} maxLength={500} onChange={(event) => setExamples(event.target.value)} />
                    </FormField>

                    {error && <FormMessage type="error" message={error} />}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="cancel" onClick={onClose}>{tCommon("cancel")}</Button>
                        <Button type="submit" variant="primary" isLoading={isLoading} loadingText={t("categorySaving")}>
                            {category ? t("updateCategoryButton") : t("createCategoryButton")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
