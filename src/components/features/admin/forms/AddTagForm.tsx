"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { FormField, FormInput, FormMessage } from "../common/FormFields";
import { Button } from "../common/Button";
import { slugify } from "@/hooks/usePostFormValidation";
import { useTranslations } from "next-intl";

interface AddTagFormProps {
    onSuccess: (tag: { id: number; name: string; slug: string }) => void;
    onClose: () => void;
}

export default function AddTagForm({ onSuccess, onClose }: AddTagFormProps) {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return setError(t("tagNameRequired"));
        const finalSlug = slug.trim() || slugify(name);
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(finalSlug)) {
            return setError(t("tagSlugInvalid"));
        }

        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), slug: finalSlug }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || t("createTagError"));
            onSuccess(json.data);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("unknownError"));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-lg border border-(--border-color) bg-background p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{t("addTagTitle")}</h2>
                    <button type="button" onClick={onClose} aria-label={tCommon("close")} className="text-foreground/60 hover:text-foreground">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField label={t("tagName")} required>
                        <FormInput
                            name="name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (!slug) setSlug(slugify(e.target.value));
                            }}
                            autoFocus
                        />
                    </FormField>

                    <FormField label={t("fieldSlug")} hint={t("tagSlugHint")}>
                        <FormInput
                            name="slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder={t("tagSlugPlaceholder")}
                        />
                    </FormField>

                    {error && <FormMessage type="error" message={error} />}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="cancel" onClick={onClose}>{tCommon("cancel")}</Button>
                        <Button type="submit" variant="primary" isLoading={isLoading} loadingText={t("creatingTag")}>
                            {t("createTagButton")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
