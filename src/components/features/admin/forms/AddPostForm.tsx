"use client";

import { useEffect, useState } from "react";
import { Check, Eye, FileEdit, FilePlus2, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
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
    onClose?: () => void;
    onSuccess?: (post: { id: number; slug: string }) => void;
    onShowToast?: (type: "success" | "error" | "info" | "warning", message: string) => void;
    existingTitles?: string[];
    existingSlugs?: string[];
}

export default function AddPostForm({ onClose, onSuccess, onShowToast, existingTitles = [], existingSlugs = [] }: AddPostFormProps) {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const router = useRouter();
    const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
    const [showAddTag, setShowAddTag] = useState(false);
    const [showAddSeries, setShowAddSeries] = useState(false);
    const { ratio, containerRef, handleMouseDown } = useResizablePanel(0.5, 0.25);
    const form = usePostForm({
        mode: "create",
        existingTitles,
        existingSlugs,
        onShowToast,
        onSuccess,
    });

    const { formData, setFormData, tags, setTags, categories, series, setSeries, selectedTagIds, setSelectedTagIds, toggleTag, validation, submitted, mdxSource, isRendering, isLoading, error, submit } = form;

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            router.push("/admin");
        }
    };

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && !showAddTag && !showAddSeries) {
                handleClose();
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    });

    return (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/75 p-2 backdrop-blur-sm sm:p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-label={t("addNewPost")}
                className="flex h-[calc(100dvh-16px)] sm:h-[calc(100dvh-32px)] w-full max-w-[1760px] flex-col overflow-hidden rounded-xl border border-(--border-color) bg-background shadow-2xl"
            >
                {/* Top Header Bar */}
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-(--border-color) bg-foreground/[0.02] px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                            <FilePlus2 size={17} />
                        </div>
                        <h2 className="text-sm sm:text-base font-semibold text-foreground truncate">
                            {t("addNewPost")}
                        </h2>
                        {formData.slug && (
                            <>
                                <div className="h-4 w-px bg-(--border-color)" />
                                <span className="inline-flex h-7 items-center rounded-md border border-(--border-color) bg-background px-2.5 text-xs font-mono text-foreground/65 truncate max-w-[260px] sm:max-w-[360px]">
                                    /post/{formData.slug}
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Mobile tab toggle */}
                        <div className="flex items-center rounded-lg border border-(--border-color) bg-foreground/5 p-0.5 lg:hidden">
                            <button
                                type="button"
                                onClick={() => setMobileTab("edit")}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                    mobileTab === "edit"
                                        ? "bg-accent text-white"
                                        : "text-foreground/60 hover:text-foreground"
                                }`}
                            >
                                <FileEdit size={12} />
                                <span>{t("editorTab")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileTab("preview")}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                    mobileTab === "preview"
                                        ? "bg-accent text-white"
                                        : "text-foreground/60 hover:text-foreground"
                                }`}
                            >
                                <Eye size={12} />
                                <span>{t("previewTitle")}</span>
                            </button>
                        </div>

                        <Button type="button" variant="cancel" size="sm" onClick={handleClose}>
                            {tCommon("cancel")}
                        </Button>
                        <Button
                            type="submit"
                            form="add-post-modal-form"
                            variant="primary"
                            size="sm"
                            isLoading={isLoading}
                            loadingText={t("creatingPost")}
                            disabled={validation.hasValidationErrors}
                            icon={isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        >
                            {t("createPostBtn")}
                        </Button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/10 hover:text-foreground cursor-pointer"
                            aria-label={tCommon("close")}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Main Split-View Body */}
                <div ref={containerRef} className="flex min-h-0 flex-1 overflow-hidden">
                    <form
                        id="add-post-modal-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            submit();
                        }}
                        style={{ "--pane-width": `${ratio * 100}%` } as React.CSSProperties}
                        className={`relative h-full flex-col border-r border-(--border-color) ${
                            mobileTab === "edit" ? "flex w-full" : "hidden"
                        } lg:flex lg:w-[var(--pane-width)]`}
                    >
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
                    </form>

                    {/* Drag handle */}
                    <div
                        onMouseDown={handleMouseDown}
                        className="hidden lg:block w-1.5 cursor-col-resize bg-transparent hover:bg-accent/40 active:bg-accent/60 transition-colors shrink-0"
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
                </div>
            </div>

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
