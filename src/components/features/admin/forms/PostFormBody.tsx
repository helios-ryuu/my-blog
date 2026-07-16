"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FolderOpen, Upload, X, Loader2 } from "lucide-react";
import { FormField, FormInput, FormTextarea, FormSelectDropdown } from "../common/FormFields";
import { TagSelector } from "../common/TagSelector";
import BucketManager from "../tabs/BucketManager";
import type { AdminCategory, AdminSeries, AdminTag } from "@/types/admin";
import { CHAR_LIMITS, LEVELS } from "@/types/admin";
import type { PostFormData } from "@/hooks/usePostFormValidation";
import { handlePostFormChange, slugify } from "@/hooks/usePostFormValidation";
import {
    POST_LEVEL_LABEL_KEYS,
    type PostCategory,
    type PostLevel,
} from "@/types/database";
import { useTranslations } from "next-intl";
import SeriesSelector from "../common/SeriesSelector";

interface PostFormBodyProps {
    formData: PostFormData;
    setFormData: React.Dispatch<React.SetStateAction<PostFormData>>;
    tags: AdminTag[];
    categories: AdminCategory[];
    series: AdminSeries[];
    postId?: number;
    selectedTagIds: number[];
    onToggleTag: (tagId: number) => void;
    onAddNewTag?: () => void;
    onAddNewSeries?: () => void;
    validationErrors: Record<string, string>;
    validationWarnings: Record<string, string>;
    autoSlug?: boolean;
    submitted?: boolean;
}

export function PostFormBody({
    formData,
    setFormData,
    tags,
    categories,
    series,
    postId,
    selectedTagIds,
    onToggleTag,
    onAddNewTag,
    onAddNewSeries,
    validationErrors,
    validationWarnings,
    autoSlug = false,
    submitted = false,
}: PostFormBodyProps) {
    const t = useTranslations("admin");
    const tPost = useTranslations("post");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [touched, setTouched] = useState<Set<string>>(new Set());
    const [usedSeriesOrders, setUsedSeriesOrders] = useState<number[]>([]);
    const [isLoadingSeriesOrders, setIsLoadingSeriesOrders] = useState(false);

    const loadSeriesOrders = useCallback(async (seriesId: number, fillNext = false) => {
        setIsLoadingSeriesOrders(true);
        try {
            const params = new URLSearchParams();
            if (postId) params.set("excludePostId", String(postId));
            const response = await fetch(`/api/admin/series/${seriesId}/posts?${params}`);
            const result = await response.json();
            if (!response.ok || !result.success) return;
            setUsedSeriesOrders(result.data.existingOrders ?? []);
            if (fillNext) {
                setFormData((previous) => ({ ...previous, series_order: result.data.nextOrder ?? 1 }));
            }
        } finally {
            setIsLoadingSeriesOrders(false);
        }
    }, [postId, setFormData]);

    useEffect(() => {
        if (formData.post_type === "series" && formData.series_id) {
            loadSeriesOrders(formData.series_id);
        } else {
            setUsedSeriesOrders([]);
        }
    }, [formData.post_type, formData.series_id, loadSeriesOrders]);

    const handleBlur = useCallback((field: string) => {
        setTouched((prev) => {
            if (prev.has(field)) return prev;
            const next = new Set(prev);
            next.add(field);
            return next;
        });
    }, []);

    const showError = (field: string) =>
        (submitted || touched.has(field)) ? validationErrors[field] : undefined;

    const showHasError = (field: string) =>
        !!(submitted || touched.has(field)) && !!validationErrors[field];

    const setImageUrl = (url: string) =>
        setFormData((prev) => ({ ...prev, image_url: url }));

    const handleFileChosen = async (file: File) => {
        setUploadError(null);
        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/admin/bucket", {
                method: "POST",
                body: fd,
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || t("uploadError"));
            setImageUrl(json.data.publicUrl);
        } catch (e) {
            setUploadError(e instanceof Error ? e.message : t("uploadError"));
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-4">
            <FormField
                label={t("fieldTitle")}
                required
                error={showError("title")}
                charCount={{ current: formData.title.length, max: CHAR_LIMITS.title }}
            >
                <FormInput
                    name="title"
                    value={formData.title}
                    hasError={showHasError("title")}
                    onBlur={() => handleBlur("title")}
                    onChange={(e) => {
                        handlePostFormChange(e, setFormData);
                        if (autoSlug) {
                            setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }));
                        }
                    }}
                />
            </FormField>

            <FormField label={t("fieldSlug")} required error={showError("slug")} hint={t("slugFieldHint")}>
                <FormInput
                    name="slug"
                    value={formData.slug}
                    hasError={showHasError("slug")}
                    onBlur={() => handleBlur("slug")}
                    onChange={(e) => handlePostFormChange(e, setFormData)}
                />
            </FormField>

            <FormField
                label={t("fieldDescription")}
                required
                error={showError("description")}
                charCount={{ current: formData.description.length, max: CHAR_LIMITS.description }}
            >
                <FormTextarea
                    name="description"
                    value={formData.description}
                    rows={2}
                    hasError={showHasError("description")}
                    onBlur={() => handleBlur("description")}
                    onChange={(e) => handlePostFormChange(e, setFormData)}
                />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-3">
                <FormField label={t("fieldCategory")} required>
                    <FormSelectDropdown
                        name="category"
                        value={formData.category}
                        options={categories.map((category) => ({
                            value: category.slug,
                            label: category.icon ? `${category.icon} ${category.name}` : category.name,
                        }))}
                        onChange={(value) => setFormData((prev) => ({ ...prev, category: value as PostCategory }))}
                    />
                </FormField>

                <FormField label={t("fieldLevel")} required>
                    <FormSelectDropdown
                        name="level"
                        value={formData.level}
                        options={LEVELS.map((level) => ({
                            value: level,
                            label: tPost(POST_LEVEL_LABEL_KEYS[level]),
                        }))}
                        onChange={(value) => setFormData((prev) => ({ ...prev, level: value as PostLevel }))}
                    />
                </FormField>

                <FormField label={t("fieldReadingTime")} hint={t("readingTimeUnit")} required error={showError("reading_time")}>
                    <FormInput
                        name="reading_time"
                        type="number"
                        min={1}
                        max={120}
                        step={1}
                        value={formData.reading_time}
                        restrictToPositiveInteger
                        hasError={showHasError("reading_time")}
                        onBlur={() => handleBlur("reading_time")}
                        onChange={(event) => setFormData((prev) => ({ ...prev, reading_time: Number(event.target.value) }))}
                    />
                </FormField>
            </div>

            <FormField label={t("fieldPostType")} required>
                <div className="inline-flex w-full rounded-md border border-(--border-color) bg-foreground/4 p-1 sm:w-auto">
                    {(["standalone", "series"] as const).map((type) => (
                        <button
                            type="button"
                            key={type}
                            onClick={() => setFormData((previous) => ({
                                ...previous,
                                post_type: type,
                                series_id: type === "standalone" ? null : previous.series_id,
                                series_order: type === "standalone" ? null : previous.series_order,
                            }))}
                            className={`min-w-32 rounded px-3 py-1.5 text-sm font-medium transition-colors ${formData.post_type === type ? "bg-accent text-white shadow-sm" : "text-foreground/60 hover:text-foreground"}`}
                        >
                            {type === "standalone" ? t("typeStandalone") : t("typeSeries")}
                        </button>
                    ))}
                </div>
            </FormField>

            {formData.post_type === "series" && (
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
                    <FormField label={t("fieldSeries")} required error={showError("series_id")}>
                        <SeriesSelector
                            series={series}
                            value={formData.series_id}
                            onCreate={() => onAddNewSeries?.()}
                            onChange={(selected) => {
                                setFormData((previous) => ({ ...previous, series_id: selected?.id ?? null, series_order: null }));
                                if (selected) loadSeriesOrders(selected.id, true);
                            }}
                        />
                    </FormField>
                    <FormField
                        label={t("fieldSeriesOrder")}
                        required
                        error={showError("series_order") || (formData.series_order && usedSeriesOrders.includes(formData.series_order) ? t("seriesOrderInUse") : undefined)}
                        hint={isLoadingSeriesOrders
                            ? t("loadingSeriesOrders")
                            : usedSeriesOrders.length > 0
                                ? t("usedSeriesOrders", { orders: usedSeriesOrders.join(", ") })
                                : t("noUsedSeriesOrders")}
                    >
                        <FormInput
                            name="series_order"
                            type="number"
                            min={1}
                            step={1}
                            value={formData.series_order ?? ""}
                            restrictToPositiveInteger
                            hasError={showHasError("series_order") || Boolean(formData.series_order && usedSeriesOrders.includes(formData.series_order))}
                            onBlur={() => handleBlur("series_order")}
                            onChange={(event) => setFormData((previous) => ({ ...previous, series_order: event.target.value ? Number(event.target.value) : null }))}
                        />
                    </FormField>
                </div>
            )}

            <FormField label={t("fieldImage")} warning={validationWarnings.image_url}>
                <div className="space-y-2">
                    <FormInput
                        name="image_url"
                        value={formData.image_url}
                        hasWarning={!!validationWarnings.image_url}
                        placeholder={t("imagePlaceholder")}
                        onChange={(e) => handlePostFormChange(e, setFormData)}
                    />
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setIsPickerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-(--border-color) bg-foreground/5 hover:bg-foreground/10 transition-colors cursor-pointer"
                        >
                            <FolderOpen size={14} />
                            {t("pickFromBucket")}
                        </button>
                        <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-(--border-color) bg-foreground/5 hover:bg-foreground/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            {isUploading ? t("uploading") : t("upload")}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFileChosen(f);
                            }}
                        />
                    </div>
                    {uploadError && (
                        <p className="text-xs text-red-500">{uploadError}</p>
                    )}
                </div>
            </FormField>

            {isPickerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
                    <div className="bg-background border border-(--border-color) rounded-lg w-full max-w-5xl h-[80vh] flex flex-col shadow-xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-(--border-color)">
                            <h2 className="text-lg font-semibold">{t("pickImageModalTitle")}</h2>
                            <button
                                type="button"
                                onClick={() => setIsPickerOpen(false)}
                                className="p-1.5 rounded hover:bg-foreground/10 cursor-pointer text-foreground/60 hover:text-foreground transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden p-4">
                            <BucketManager
                                mode="picker"
                                onPick={(file) => {
                                    setImageUrl(file.publicUrl);
                                    setIsPickerOpen(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <TagSelector
                tags={tags}
                selectedTags={selectedTagIds}
                maxTags={5}
                onToggle={onToggleTag}
                onAddNew={onAddNewTag}
            />

            <FormField
                label={t("fieldContent")}
                required
                error={showError("content")}
                warning={validationWarnings.content}
                charCount={{ current: formData.content.length, max: CHAR_LIMITS.content }}
            >
                <FormTextarea
                    name="content"
                    value={formData.content}
                    rows={14}
                    hasError={showHasError("content")}
                    hasWarning={!!validationWarnings.content}
                    className="font-mono"
                    onBlur={() => handleBlur("content")}
                    onChange={(e) => handlePostFormChange(e, setFormData)}
                />
            </FormField>

            <label className="flex items-start gap-2 text-sm text-foreground/70 cursor-pointer">
                <input
                    type="checkbox"
                    name="published"
                    checked={formData.published}
                    onChange={(e) => handlePostFormChange(e, setFormData)}
                    className="accent-accent mt-0.5"
                />
                <div>
                    <span>{t("publishImmediately")}</span>
                    <p className="text-xs text-foreground/50 mt-0.5">{t("publishImmediatelyHint")}</p>
                </div>
            </label>
        </div>
    );
}
