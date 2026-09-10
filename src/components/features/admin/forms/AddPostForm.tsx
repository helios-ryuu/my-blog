"use client";

import { useState } from "react";
import { ArrowLeft, Eye, FileEdit } from "lucide-react";
import Link from "next/link";
import AddTagForm from "./AddTagForm";
import { FormMessage } from "../common/FormFields";
import { Button } from "../common/Button";
import { PostFormBody } from "./PostFormBody";
import { PostPreviewPanel } from "../common/PostPreviewPanel";
import { usePostForm } from "@/hooks/usePostForm";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import { useTranslations } from "next-intl";
import SeriesForm from "./SeriesForm";

interface AddPostFormProps {
    onSuccess?: (post: { id: number; slug: string }) => void;
    onShowToast?: (type: "success" | "error" | "info" | "warning", message: string) => void;
    existingTitles?: string[];
    existingSlugs?: string[];
}

export default function AddPostForm({ onSuccess, onShowToast, existingTitles = [], existingSlugs = [] }: AddPostFormProps) {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
    const [showAddTag, setShowAddTag] = useState(false);
    const [showAddSeries, setShowAddSeries] = useState(false);
    const { ratio, containerRef, handleMouseDown } = useResizablePanel(0.5, 0.2);
    const form = usePostForm({
        mode: "create",
        existingTitles,
        existingSlugs,
        onShowToast,
        onSuccess,
    });

    const { formData, setFormData, tags, setTags, categories, series, setSeries, selectedTagIds, setSelectedTagIds, toggleTag, validation, submitted, mdxSource, isRendering, isLoading, error, submit } = form;

    return (
        <div ref={containerRef} className="fixed inset-0 z-30 flex bg-background">
            <form
                onSubmit={(e) => { e.preventDefault(); submit(); }}
                style={{ "--pane-width": `${ratio * 100}%` } as React.CSSProperties}
                className={`h-full flex-col border-r border-(--border-color) ${
                    mobileTab === "edit" ? "flex w-full" : "hidden"
                } lg:flex lg:w-[var(--pane-width)]`}
            >
                <div className="flex items-center justify-between p-4 border-b border-(--border-color)">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin"
                            className="p-1 rounded hover:bg-foreground/10 cursor-pointer text-foreground/60 hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <h2 className="text-lg font-semibold">{t("addNewPost")}</h2>
                    </div>

                    {/* Mobile tab toggle */}
                    <div className="flex items-center rounded-lg border border-(--border-color) bg-foreground/5 p-0.5 lg:hidden">
                        <button
                            type="button"
                            onClick={() => setMobileTab("edit")}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                mobileTab === "edit"
                                    ? "bg-accent text-accent-foreground shadow-sm"
                                    : "text-foreground/60 hover:text-foreground"
                            }`}
                        >
                            <FileEdit size={13} />
                            <span>{t("editorTab")}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileTab("preview")}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                mobileTab === "preview"
                                    ? "bg-accent text-accent-foreground shadow-sm"
                                    : "text-foreground/60 hover:text-foreground"
                            }`}
                        >
                            <Eye size={13} />
                            <span>{t("previewTitle")}</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <PostFormBody
                        formData={formData}
                        setFormData={setFormData}
                        tags={tags}
                        categories={categories}
                        series={series}
                        selectedTagIds={selectedTagIds}
                        onToggleTag={toggleTag}
                        onAddNewTag={() => setShowAddTag(true)}
                        onAddNewSeries={() => setShowAddSeries(true)}
                        validationErrors={validation.validationErrors}
                        validationWarnings={validation.validationWarnings}
                        submitted={submitted}
                        autoSlug
                    />
                    {error && <FormMessage type="error" message={error} />}
                </div>

                <div className="p-4 border-t border-(--border-color) flex justify-end gap-2">
                    <Link href="/admin">
                        <Button type="button" variant="cancel">{tCommon("cancel")}</Button>
                    </Link>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isLoading}
                        loadingText={t("creatingPost")}
                        disabled={validation.hasValidationErrors}
                    >
                        {t("createPostBtn")}
                    </Button>
                </div>
            </form>

            {/* Drag handle */}
            <div
                onMouseDown={handleMouseDown}
                className="hidden lg:block w-1 cursor-col-resize bg-transparent hover:bg-accent/40 active:bg-accent/60 transition-colors flex-shrink-0"
            />

            <PostPreviewPanel
                className={`${mobileTab === "preview" ? "flex w-full" : "hidden"} lg:flex lg:flex-1`}
                onBackToEdit={() => setMobileTab("edit")}
                title={formData.title}
                description={formData.description}
                imageUrl={formData.image_url}
                category={formData.category}
                categoryInfo={categories.find((category) => category.slug === formData.category)}
                level={formData.level}
                readingTime={formData.reading_time}
                type={formData.post_type}
                series={series.find((item) => item.id === formData.series_id)}
                seriesOrder={formData.series_order}
                selectedTags={selectedTagIds}
                tags={tags}
                mdxSource={mdxSource}
                isRendering={isRendering}
            />

            {showAddTag && (
                <AddTagForm
                    onSuccess={(tag) => {
                        setTags((prev) => [...prev, tag]);
                        setSelectedTagIds((prev) => [...prev, tag.id]);
                    }}
                    onClose={() => setShowAddTag(false)}
                />
            )}

            {showAddSeries && (
                <SeriesForm
                    onSuccess={(created) => {
                        setSeries((previous) => [...previous, { ...created, post_count: 0 }]);
                        setFormData((previous) => ({ ...previous, post_type: "series", series_id: created.id, series_order: 1 }));
                    }}
                    onClose={() => setShowAddSeries(false)}
                />
            )}
        </div>
    );
}
