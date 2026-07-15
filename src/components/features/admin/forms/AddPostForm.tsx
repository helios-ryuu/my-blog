"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import AddTagForm from "./AddTagForm";
import { FormMessage } from "../common/FormFields";
import { Button } from "../common/Button";
import { PostFormBody } from "./PostFormBody";
import { PostPreviewPanel } from "../common/PostPreviewPanel";
import { usePostForm } from "@/hooks/usePostForm";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import { useTranslations } from "next-intl";

interface AddPostFormProps {
    onSuccess?: (post: { id: number; slug: string }) => void;
    onShowToast?: (type: "success" | "error" | "info" | "warning", message: string) => void;
    existingTitles?: string[];
    existingSlugs?: string[];
}

export default function AddPostForm({ onSuccess, onShowToast, existingTitles = [], existingSlugs = [] }: AddPostFormProps) {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const [showAddTag, setShowAddTag] = useState(false);
    const { ratio, containerRef, handleMouseDown } = useResizablePanel(0.5, 0.2);
    const form = usePostForm({
        mode: "create",
        existingTitles,
        existingSlugs,
        onShowToast,
        onSuccess,
    });

    const { formData, setFormData, tags, setTags, selectedTagIds, setSelectedTagIds, toggleTag, validation, submitted, mdxSource, isRendering, isLoading, error, submit } = form;

    return (
        <div ref={containerRef} className="fixed inset-0 z-30 flex bg-background pt-[var(--header-height,0px)]">
            <form
                onSubmit={(e) => { e.preventDefault(); submit(); }}
                style={{ width: `${ratio * 100}%` }}
                className="h-full flex flex-col border-r border-(--border-color)"
            >
                <div className="flex items-center justify-between p-4 border-b border-(--border-color)">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin"
                            className="p-1 rounded hover:bg-foreground/10 cursor-pointer text-foreground/60 hover:text-foreground"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <h2 className="text-lg font-semibold">{t("addNewPost")}</h2>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <PostFormBody
                        formData={formData}
                        setFormData={setFormData}
                        tags={tags}
                        selectedTagIds={selectedTagIds}
                        onToggleTag={toggleTag}
                        onAddNewTag={() => setShowAddTag(true)}
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
                className="w-1 cursor-col-resize bg-transparent hover:bg-accent/40 active:bg-accent/60 transition-colors flex-shrink-0"
            />

            <PostPreviewPanel
                title={formData.title}
                description={formData.description}
                imageUrl={formData.image_url}
                category={formData.category}
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
        </div>
    );
}
