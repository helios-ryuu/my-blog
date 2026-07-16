"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { slugify } from "@/hooks/usePostFormValidation";
import type { AdminSeries } from "@/types/admin";
import { Button } from "../common/Button";
import { FormField, FormInput, FormMessage, FormTextarea } from "../common/FormFields";

interface SeriesFormProps {
    series?: AdminSeries | null;
    onSuccess: (series: AdminSeries) => void;
    onClose: () => void;
}

export default function SeriesForm({ series, onSuccess, onClose }: SeriesFormProps) {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const [name, setName] = useState(series?.name ?? "");
    const [slug, setSlug] = useState(series?.slug ?? "");
    const [description, setDescription] = useState(series?.description ?? "");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const close = (event: KeyboardEvent) => event.key === "Escape" && !isLoading && onClose();
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, [isLoading, onClose]);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        const finalSlug = slug.trim() || slugify(name);
        if (!name.trim() || !finalSlug) return setError(t("seriesRequiredFields"));
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(series ? `/api/admin/series/${series.id}` : "/api/admin/series", {
                method: series ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), slug: finalSlug, description: description.trim() || null }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || t("seriesSaveError"));
            onSuccess(result.data);
            onClose();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t("seriesSaveError"));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" onClick={() => !isLoading && onClose()}>
            <div className="w-full max-w-xl rounded-lg border border-(--border-color) bg-background p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{series ? t("editSeriesTitle") : t("addSeriesTitle")}</h2>
                    <button type="button" onClick={onClose} disabled={isLoading} aria-label={tCommon("close")} className="text-foreground/60 hover:text-foreground disabled:opacity-50"><X size={18} /></button>
                </div>
                <form onSubmit={submit} className="space-y-4">
                    <FormField label={t("seriesName")} required>
                        <FormInput name="name" value={name} maxLength={100} autoFocus onChange={(event) => {
                            setName(event.target.value);
                            if (!series && (!slug || slug === slugify(name))) setSlug(slugify(event.target.value));
                        }} />
                    </FormField>
                    <FormField label={t("fieldSlug")} required hint={t("slugFieldHint")}>
                        <FormInput name="slug" value={slug} maxLength={100} onChange={(event) => setSlug(event.target.value)} />
                    </FormField>
                    <FormField label={t("fieldDescription")} hint={t("seriesDescriptionHint")}>
                        <FormTextarea name="description" value={description} rows={3} maxLength={500} onChange={(event) => setDescription(event.target.value)} />
                    </FormField>
                    {error && <FormMessage type="error" message={error} />}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="cancel" onClick={onClose}>{tCommon("cancel")}</Button>
                        <Button type="submit" variant="primary" isLoading={isLoading} loadingText={t("seriesSaving")}>{series ? t("updateSeriesButton") : t("createSeriesButton")}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
