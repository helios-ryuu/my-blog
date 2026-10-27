"use client";

import { useRef, useState } from "react";
import {
    CheckCircle2,
    Download,
    Edit3,
    FileCode2,
    FileUp,
    Loader2,
    Sparkles,
    Upload,
    X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "../common/Button";
import { FormField, FormInput, FormSelectDropdown, FormTextarea } from "../common/FormFields";
import { TagSelector } from "../common/TagSelector";
import {
    downloadMdxTemplate,
    parseMdxFileContent,
    slugifyText,
    type ParsedMdxDraft,
} from "@/lib/mdx-frontmatter";
import { CHAR_LIMITS, LEVELS, type AdminCategory, type AdminPost, type AdminTag } from "@/types/admin";
import { POST_LEVEL_LABEL_KEYS, type PostCategory, type PostLevel } from "@/types/database";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface UploadPostModalProps {
    posts: AdminPost[];
    categories: AdminCategory[];
    tags: AdminTag[];
    onClose: () => void;
    onSuccess: (createdPost: { id: number; slug: string; title: string }) => void;
    onEditPost: (id: number) => void;
    onShowToast?: (type: "success" | "error" | "info" | "warning", message: string) => void;
}

export default function UploadPostModal({
    posts,
    categories,
    tags,
    onClose,
    onSuccess,
    onEditPost,
    onShowToast,
}: UploadPostModalProps) {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const tPost = useTranslations("post");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [fileName, setFileName] = useState<string>("");
    const [isDragging, setIsDragging] = useState(false);
    const [draftData, setDraftData] = useState<ParsedMdxDraft | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>("");
    const [createdDraft, setCreatedDraft] = useState<{ id: number; slug: string; title: string } | null>(null);

    useEscapeKey(onClose, true);

    const existingSlugs = posts.map((p) => p.slug);
    const existingTitles = posts.map((p) => p.title);

    async function processFile(file: File) {
        setError("");
        setCreatedDraft(null);
        if (!/\.(mdx|md)$/i.test(file.name)) {
            setError(t("uploadMdxInvalidType"));
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError(t("uploadMdxTooLarge"));
            return;
        }
        try {
            const rawText = await file.text();
            if (!rawText.trim()) {
                setError(t("uploadMdxEmpty"));
                return;
            }
            const parsed = parseMdxFileContent(rawText, file.name, {
                categories,
                tags,
                existingSlugs,
                existingTitles,
            });
            setFileName(file.name);
            setDraftData(parsed);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("uploadMdxReadError"));
        }
    }

    function handleDrop(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
            void processFile(file);
        }
    }

    function toggleTag(tagId: number) {
        if (!draftData) return;
        setDraftData((prev) => {
            if (!prev) return prev;
            const exists = prev.tag_ids.includes(tagId);
            const nextTagIds = exists
                ? prev.tag_ids.filter((id) => id !== tagId)
                : prev.tag_ids.length < 5
                    ? [...prev.tag_ids, tagId]
                    : prev.tag_ids;
            return { ...prev, tag_ids: nextTagIds };
        });
    }

    async function handleSaveDraft(e: React.FormEvent) {
        e.preventDefault();
        if (!draftData) return;
        setError("");

        const trimmedTitle = draftData.title.trim();
        const trimmedSlug = draftData.slug.trim();
        const trimmedDesc = draftData.description.trim();
        const trimmedContent = draftData.content.trim();

        if (!trimmedTitle) {
            setError(t("titleRequired"));
            return;
        }
        if (!trimmedSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug)) {
            setError(t("postSlugInvalid"));
            return;
        }
        if (!trimmedDesc) {
            setError(t("descriptionRequired"));
            return;
        }
        if (!trimmedContent) {
            setError(t("contentRequired"));
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: trimmedTitle,
                    slug: trimmedSlug,
                    description: trimmedDesc,
                    content: trimmedContent,
                    image_url: draftData.image_url.trim() || null,
                    category: draftData.category,
                    level: draftData.level,
                    reading_time: draftData.reading_time,
                    series_id: null,
                    series_order: null,
                    published: false,
                    tag_ids: draftData.tag_ids,
                }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.message || t("savePostError"));
            }

            const resultPost = {
                id: json.data.id as number,
                slug: json.data.slug as string,
                title: trimmedTitle,
            };
            setCreatedDraft(resultPost);
            onShowToast?.("success", t("uploadMdxSuccess", { title: trimmedTitle }));
            onSuccess(resultPost);
        } catch (err) {
            const msg = err instanceof Error ? err.message : t("savePostError");
            setError(msg);
            onShowToast?.("error", msg);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="upload-post-modal-title"
                className="flex max-h-[min(780px,calc(100dvh-24px))] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-(--border-color) bg-background shadow-2xl"
            >
                {/* Header */}
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-(--border-color) px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                            <FileUp size={18} />
                        </div>
                        <div>
                            <h2 id="upload-post-modal-title" className="text-base font-semibold text-foreground">
                                {t("uploadPostTitle")}
                            </h2>
                            <p className="mt-0.5 text-xs text-foreground/60">
                                {t("uploadPostSubtitle")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => downloadMdxTemplate("post-template.mdx")}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-3 text-xs font-medium text-accent hover:bg-accent/20 transition-colors cursor-pointer"
                        >
                            <Download size={13} />
                            <span>{t("downloadMdxTemplate")}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground/55 transition-colors hover:bg-foreground/10 hover:text-foreground"
                            aria-label={tCommon("close")}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Dropzone */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                            isDragging
                                ? "border-accent bg-accent/10"
                                : fileName
                                    ? "border-accent/50 bg-accent/5"
                                    : "border-(--border-color) bg-foreground/[0.02] hover:border-accent/50 hover:bg-foreground/[0.04]"
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".mdx,.md,text/markdown,text/plain"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void processFile(file);
                                e.target.value = "";
                            }}
                        />
                        <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-accent/12 text-accent">
                            {fileName ? <FileCode2 size={22} /> : <Upload size={22} />}
                        </div>
                        {fileName ? (
                            <>
                                <p className="text-sm font-semibold text-foreground">{fileName}</p>
                                <p className="mt-1 text-xs text-accent">
                                    {t("uploadMdxChangeFile")}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-foreground">
                                    {t("uploadMdxDropzoneTitle")}
                                </p>
                                <p className="mt-1 text-xs text-foreground/55">
                                    {t("uploadMdxDropzoneHint")}
                                </p>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-500/35 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400">
                            {error}
                        </div>
                    )}

                    {createdDraft && (
                        <div className="rounded-xl border border-green-500/35 bg-green-500/10 p-4 space-y-3">
                            <div className="flex items-start gap-2.5">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                <div className="space-y-1 text-xs">
                                    <p className="font-semibold text-sm text-foreground">
                                        {t("uploadMdxCreatedBannerTitle")}
                                    </p>
                                    <p className="text-foreground/70">
                                        <span className="font-medium text-foreground">{createdDraft.title}</span>{" "}
                                        (<code className="font-mono text-accent">/{createdDraft.slug}</code>)
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="utility"
                                    size="sm"
                                    onClick={onClose}
                                >
                                    {tCommon("close")}
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    icon={<Edit3 size={14} />}
                                    onClick={() => {
                                        onClose();
                                        onEditPost(createdDraft.id);
                                    }}
                                >
                                    {t("openInEditor")}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Extracted Metadata Preview & Quick Adjustment */}
                    {draftData && !createdDraft && (
                        <form id="upload-mdx-form" onSubmit={handleSaveDraft} className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border border-(--border-color) bg-foreground/5 px-3 py-2 text-xs">
                                <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                                    <Sparkles size={14} className="text-accent" />
                                    {draftData.hasFrontmatter
                                        ? t("uploadMdxFrontmatterDetected")
                                        : t("uploadMdxAutoFallbackDetected")}
                                </span>
                                <span className="font-mono text-foreground/55">
                                    {draftData.content.length.toLocaleString()} / {CHAR_LIMITS.content.toLocaleString()} chars
                                </span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormField
                                    label={t("fieldTitle")}
                                    required
                                    charCount={{ current: draftData.title.length, max: CHAR_LIMITS.title }}
                                >
                                    <FormInput
                                        value={draftData.title}
                                        onChange={(e) => {
                                            const nextTitle = e.target.value;
                                            setDraftData((prev) =>
                                                prev
                                                    ? {
                                                          ...prev,
                                                          title: nextTitle,
                                                          slug: slugifyText(nextTitle),
                                                      }
                                                    : prev,
                                            );
                                        }}
                                    />
                                </FormField>

                                <FormField label={t("fieldSlug")} required>
                                    <FormInput
                                        value={draftData.slug}
                                        onChange={(e) =>
                                            setDraftData((prev) =>
                                                prev ? { ...prev, slug: e.target.value } : prev,
                                            )
                                        }
                                    />
                                </FormField>
                            </div>

                            <FormField
                                label={t("fieldDescription")}
                                required
                                charCount={{ current: draftData.description.length, max: CHAR_LIMITS.description }}
                            >
                                <FormTextarea
                                    rows={2}
                                    value={draftData.description}
                                    onChange={(e) =>
                                        setDraftData((prev) =>
                                            prev ? { ...prev, description: e.target.value } : prev,
                                        )
                                    }
                                />
                            </FormField>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <FormField label={t("fieldCategory")} required>
                                    <FormSelectDropdown
                                        name="category"
                                        value={draftData.category}
                                        options={categories.map((cat) => ({
                                            value: cat.slug,
                                            label: cat.icon ? `${cat.icon} ${cat.name}` : cat.name,
                                        }))}
                                        onChange={(val) =>
                                            setDraftData((prev) =>
                                                prev ? { ...prev, category: val as PostCategory } : prev,
                                            )
                                        }
                                    />
                                </FormField>

                                <FormField label={t("fieldLevel")} required>
                                    <FormSelectDropdown
                                        name="level"
                                        value={draftData.level}
                                        options={LEVELS.map((lvl) => ({
                                            value: lvl,
                                            label: tPost(POST_LEVEL_LABEL_KEYS[lvl]),
                                        }))}
                                        onChange={(val) =>
                                            setDraftData((prev) =>
                                                prev ? { ...prev, level: val as PostLevel } : prev,
                                            )
                                        }
                                    />
                                </FormField>

                                <FormField label={t("fieldReadingTime")} required>
                                    <FormInput
                                        type="number"
                                        min={1}
                                        max={120}
                                        value={draftData.reading_time}
                                        restrictToPositiveInteger
                                        onChange={(e) =>
                                            setDraftData((prev) =>
                                                prev
                                                    ? { ...prev, reading_time: Number(e.target.value) || 1 }
                                                    : prev,
                                            )
                                        }
                                    />
                                </FormField>
                            </div>

                            <TagSelector
                                tags={tags}
                                selectedTags={draftData.tag_ids}
                                maxTags={5}
                                onToggle={toggleTag}
                            />

                            {draftData.unmatchedTagNames.length > 0 && (
                                <p className="text-[11px] text-amber-500">
                                    {t("uploadMdxUnmatchedTags", {
                                        tags: draftData.unmatchedTagNames.join(", "),
                                    })}
                                </p>
                            )}
                        </form>
                    )}
                </div>

                {/* Footer */}
                {!createdDraft && (
                    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-(--border-color) px-5 py-3.5">
                        <span className="text-xs text-foreground/55">
                            {t("uploadMdxDraftNotice")}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="cancel" size="sm" onClick={onClose}>
                                {tCommon("cancel")}
                            </Button>
                            <Button
                                type="submit"
                                form="upload-mdx-form"
                                variant="primary"
                                size="sm"
                                disabled={!draftData || isSubmitting}
                                isLoading={isSubmitting}
                                loadingText={t("creatingPost")}
                                icon={isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
                            >
                                {t("saveAsDraftBtn")}
                            </Button>
                        </div>
                    </footer>
                )}
            </section>
        </div>
    );
}

