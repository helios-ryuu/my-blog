"use client";

import { useCallback, useRef, useState } from "react";
import { FolderOpen, Upload, X, Loader2 } from "lucide-react";
import { FormField, FormInput, FormTextarea, FormSelectDropdown } from "../common/FormFields";
import { TagSelector } from "../common/TagSelector";
import BucketManager from "../tabs/BucketManager";
import type { AdminTag } from "@/types/admin";
import { CATEGORIES, CHAR_LIMITS } from "@/types/admin";
import type { PostFormData } from "@/hooks/usePostFormValidation";
import { handlePostFormChange, slugify } from "@/hooks/usePostFormValidation";
import type { PostCategory } from "@/types/database";
import { useTranslations } from "next-intl";

interface PostFormBodyProps {
    formData: PostFormData;
    setFormData: React.Dispatch<React.SetStateAction<PostFormData>>;
    tags: AdminTag[];
    selectedTagIds: number[];
    onToggleTag: (tagId: number) => void;
    onAddNewTag?: () => void;
    validationErrors: Record<string, string>;
    validationWarnings: Record<string, string>;
    autoSlug?: boolean;
    submitted?: boolean;
}

export function PostFormBody({
    formData,
    setFormData,
    tags,
    selectedTagIds,
    onToggleTag,
    onAddNewTag,
    validationErrors,
    validationWarnings,
    autoSlug = false,
    submitted = false,
}: PostFormBodyProps) {
    const t = useTranslations("admin");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [touched, setTouched] = useState<Set<string>>(new Set());

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
            const res = await fetch("/api/admin/bucket?bucket=post-images", {
                method: "POST",
                body: fd,
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Upload failed");
            setImageUrl(json.data.publicUrl);
        } catch (e) {
            setUploadError(e instanceof Error ? e.message : "Upload failed");
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

            <FormField label="Slug" required error={showError("slug")} hint={t("slugFieldHint")}>
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

            <FormField label={t("fieldCategory")} required>
                <FormSelectDropdown
                    name="category"
                    value={formData.category}
                    options={CATEGORIES.map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }))}
                    onChange={(v) => setFormData((prev) => ({ ...prev, category: v as PostCategory }))}
                />
            </FormField>

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
                                initialBucket="post-images"
                                allowBucketSwitch={false}
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
