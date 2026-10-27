"use client";

import { useEffect, useRef, useState } from "react";
import {
    BookOpen,
    Check,
    Eye,
    FileEdit,
    FolderOpen,
    Loader2,
    Maximize2,
    Minimize2,
    Plus,
    RotateCcw,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import remarkGfm from "remark-gfm";
import { useTranslations } from "next-intl";
import { mdxComponents } from "@/../mdx-components";
import { DEFAULT_DOCS_CONFIG, type DocItem, type DocsConfig } from "@/data/docs-content";
import { slugifyText } from "@/lib/mdx-frontmatter";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { Button } from "../common/Button";
import { FormField, FormInput, FormMessage, FormTextarea } from "../common/FormFields";
import BucketManager from "../tabs/BucketManager";
import { CHAR_LIMITS } from "@/types/admin";

interface DocsEditorModalProps {
    initialConfig: DocsConfig;
    initialActiveSlug?: string;
    onClose: () => void;
    onSaved: (updated: DocsConfig) => void;
    onShowToast?: (type: "success" | "error" | "info" | "warning", message: string) => void;
}

export default function DocsEditorModal({
    initialConfig,
    initialActiveSlug,
    onClose,
    onSaved,
    onShowToast,
}: DocsEditorModalProps) {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [items, setItems] = useState<DocItem[]>(() =>
        initialConfig.items.length > 0 ? initialConfig.items : DEFAULT_DOCS_CONFIG.items,
    );
    const [activeIndex, setActiveIndex] = useState<number>(() => {
        if (!initialActiveSlug) return 0;
        const idx = initialConfig.items.findIndex((i) => i.slug === initialActiveSlug);
        return idx >= 0 ? idx : 0;
    });

    const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
    const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
    const [isRendering, setIsRendering] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string>("");

    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isContentExpanded, setIsContentExpanded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const { ratio, containerRef, handleMouseDown } = useResizablePanel(0.5, 0.25);

    useEscapeKey(() => {
        if (isPickerOpen) {
            setIsPickerOpen(false);
        } else if (isContentExpanded) {
            setIsContentExpanded(false);
        } else {
            onClose();
        }
    }, true);

    const currentItem = items[activeIndex] ?? items[0];

    function updateCurrentItem(patch: Partial<DocItem>) {
        setItems((prev) =>
            prev.map((item, idx) => (idx === activeIndex ? { ...item, ...patch } : item)),
        );
    }

    function handleAddDocSection() {
        const nextIndex = items.length + 1;
        const newTitle = `Tài liệu mới ${nextIndex}`;
        const newSlug = `tai-lieu-moi-${nextIndex}`;
        const newItem: DocItem = {
            id: `${newSlug}-${Date.now()}`,
            slug: newSlug,
            title: newTitle,
            description: "Mô tả ngắn cho mục tài liệu này.",
            content: `## Giới thiệu\n\nNội dung cho mục **${newTitle}**.`,
            updatedAt: new Date().toISOString(),
        };
        setItems((prev) => [...prev, newItem]);
        setActiveIndex(items.length);
    }

    function handleDeleteCurrentSection() {
        if (items.length <= 1) return;
        setItems((prev) => prev.filter((_, idx) => idx !== activeIndex));
        setActiveIndex((prev) => Math.max(0, prev - 1));
    }

    function handleResetDefaultMarkdownDoc() {
        const defaultMarkdown = DEFAULT_DOCS_CONFIG.items[0];
        if (!defaultMarkdown) return;
        updateCurrentItem({
            title: defaultMarkdown.title,
            slug: defaultMarkdown.slug,
            description: defaultMarkdown.description,
            content: defaultMarkdown.content,
        });
        onShowToast?.("info", t("docsResetDefaultToast"));
    }

    // Live MDX preview compilation (debounced 400ms)
    useEffect(() => {
        const content = currentItem?.content ?? "";
        if (!content.trim()) {
            setMdxSource(null);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(async () => {
            setIsRendering(true);
            try {
                const compiled = await serialize(content, {
                    mdxOptions: { remarkPlugins: [remarkGfm] },
                });
                if (!cancelled) setMdxSource(compiled);
            } catch {
                // Keep previous preview on transient syntax errors while typing
            } finally {
                if (!cancelled) setIsRendering(false);
            }
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [currentItem?.content]);

    function insertMarkdownImage(url: string, name = "image") {
        const cleanAlt = name.replace(/\.[^.]+$/, "");
        const snippet = `\n![${cleanAlt}](${url})\n`;
        updateCurrentItem({
            content: `${currentItem.content}${snippet}`,
        });
        onShowToast?.("success", t("docsImageInserted"));
    }

    async function handleFileUpload(file: File) {
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
            insertMarkdownImage(json.data.publicUrl, file.name);
        } catch (err) {
            onShowToast?.("error", err instanceof Error ? err.message : t("uploadError"));
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    async function handleSave() {
        setError("");
        for (const item of items) {
            if (!item.title.trim()) {
                setError(t("titleRequired"));
                return;
            }
            if (!item.slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug.trim())) {
                setError(t("postSlugInvalid"));
                return;
            }
            if (!item.content.trim()) {
                setError(t("contentRequired"));
                return;
            }
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/docs", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.message || t("docsSaveError"));
            }
            onSaved(json.data as DocsConfig);
            onShowToast?.("success", t("docsSaveSuccess"));
            onClose();
        } catch (err) {
            const msg = err instanceof Error ? err.message : t("docsSaveError");
            setError(msg);
            onShowToast?.("error", msg);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/75 p-2 backdrop-blur-sm sm:p-4">
            <div
                ref={containerRef}
                role="dialog"
                aria-modal="true"
                aria-label={t("docsEditorTitle")}
                className="flex h-[calc(100dvh-16px)] sm:h-[calc(100dvh-32px)] w-full max-w-[1760px] flex-col overflow-hidden rounded-xl border border-(--border-color) bg-background shadow-2xl"
            >
                {/* Top Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border-color) bg-foreground/[0.02] px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                            <BookOpen size={17} />
                        </div>
                        <h2 className="text-sm sm:text-base font-semibold text-foreground">
                            {t("docsEditorTitle")}
                        </h2>

                        <div className="h-4 w-px bg-(--border-color)" />

                        {/* Section selector */}
                        <select
                            value={activeIndex}
                            onChange={(e) => setActiveIndex(Number(e.target.value))}
                            className="h-8 rounded-md border border-(--border-color) bg-background px-2.5 text-xs font-medium text-foreground outline-none focus:border-accent"
                        >
                            {items.map((item, idx) => (
                                <option key={item.id || idx} value={idx}>
                                    {idx + 1}. {item.title || "(Untitled)"}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={handleAddDocSection}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-(--border-color) bg-background px-2.5 text-xs font-medium text-foreground/80 hover:border-accent hover:text-accent transition-colors cursor-pointer"
                        >
                            <Plus size={13} />
                            <span>{t("docsAddSection")}</span>
                        </button>

                        {items.length > 1 && (
                            <button
                                type="button"
                                onClick={handleDeleteCurrentSection}
                                className="inline-flex h-8 items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                            >
                                <Trash2 size={13} />
                                <span>{tCommon("delete")}</span>
                            </button>
                        )}

                        {currentItem?.slug === "markdown-syntax" && (
                            <button
                                type="button"
                                onClick={handleResetDefaultMarkdownDoc}
                                title={t("docsResetDefault")}
                                className="inline-flex h-8 items-center gap-1 rounded-md border border-(--border-color) bg-background px-2.5 text-xs text-foreground/65 hover:text-foreground transition-colors cursor-pointer"
                            >
                                <RotateCcw size={12} />
                                <span className="hidden md:inline">{t("docsResetDefault")}</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mobile tab toggle */}
                        <div className="flex items-center rounded-lg border border-(--border-color) bg-foreground/5 p-0.5 lg:hidden">
                            <button
                                type="button"
                                onClick={() => setMobileTab("edit")}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                    mobileTab === "edit"
                                        ? "bg-accent text-white shadow-sm"
                                        : "text-foreground/60 hover:text-foreground"
                                }`}
                            >
                                <FileEdit size={13} />
                                <span>{t("editorTab")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileTab("preview")}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                    mobileTab === "preview"
                                        ? "bg-accent text-white shadow-sm"
                                        : "text-foreground/60 hover:text-foreground"
                                }`}
                            >
                                <Eye size={13} />
                                <span>{t("previewTitle")}</span>
                            </button>
                        </div>

                        <Button type="button" variant="cancel" size="sm" onClick={onClose}>
                            {tCommon("cancel")}
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving}
                            isLoading={isSaving}
                            loadingText={tCommon("loading")}
                            icon={<Check size={14} />}
                        >
                            {tCommon("save")}
                        </Button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/55 hover:bg-foreground/10 hover:text-foreground cursor-pointer"
                            aria-label={tCommon("close")}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Split 2-column Workspace */}
                <div className="flex flex-1 min-h-0 overflow-hidden">
                    {/* Left Column: MDX Editor */}
                    <div
                        style={{ "--pane-width": `${ratio * 100}%` } as React.CSSProperties}
                        className={`relative h-full flex-col border-r border-(--border-color) ${
                            mobileTab === "edit" ? "flex w-full" : "hidden"
                        } lg:flex lg:w-[var(--pane-width)]`}
                    >
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {error && <FormMessage type="error" message={error} />}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    label={t("fieldTitle")}
                                    required
                                    charCount={{ current: currentItem.title.length, max: CHAR_LIMITS.title }}
                                >
                                    <FormInput
                                        value={currentItem.title}
                                        onChange={(e) => {
                                            const nextTitle = e.target.value;
                                            updateCurrentItem({
                                                title: nextTitle,
                                                slug: currentItem.slug === "markdown-syntax"
                                                    ? "markdown-syntax"
                                                    : slugifyText(nextTitle),
                                            });
                                        }}
                                    />
                                </FormField>

                                <FormField label={t("fieldSlug")} required>
                                    <FormInput
                                        value={currentItem.slug}
                                        onChange={(e) =>
                                            updateCurrentItem({ slug: e.target.value })
                                        }
                                    />
                                </FormField>
                            </div>

                            <FormField
                                label={t("fieldDescription")}
                                charCount={{ current: currentItem.description.length, max: CHAR_LIMITS.description }}
                            >
                                <FormTextarea
                                    rows={2}
                                    value={currentItem.description}
                                    onChange={(e) =>
                                        updateCurrentItem({ description: e.target.value })
                                    }
                                />
                            </FormField>

                            {/* Quick R2 Media Insertion Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-(--border-color) bg-foreground/[0.03] px-3 py-2">
                                <span className="text-xs font-medium text-foreground/70">
                                    {t("docsInsertMediaHint")}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsPickerOpen(true)}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-(--border-color) bg-background px-2.5 py-1 text-xs font-medium hover:border-accent hover:text-accent transition-colors cursor-pointer"
                                    >
                                        <FolderOpen size={13} />
                                        <span>{t("pickFromBucket")}</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isUploading}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-(--border-color) bg-background px-2.5 py-1 text-xs font-medium hover:border-accent hover:text-accent transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                        <span>{isUploading ? t("uploading") : t("upload")}</span>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) void handleFileUpload(file);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className={isContentExpanded ? "absolute inset-0 z-20 flex flex-col bg-background p-5" : ""}>
                                <FormField
                                    label={t("fieldContent")}
                                    required
                                    charCount={{ current: currentItem.content.length, max: CHAR_LIMITS.content }}
                                    className={isContentExpanded ? "flex flex-1 flex-col min-h-0" : ""}
                                    labelRight={
                                        <button
                                            type="button"
                                            onClick={() => setIsContentExpanded((prev) => !prev)}
                                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer ${
                                                isContentExpanded
                                                    ? "border-accent/50 bg-accent/15 text-accent hover:bg-accent/25"
                                                    : "border-(--border-color) bg-foreground/5 text-foreground/75 hover:border-accent hover:text-accent"
                                            }`}
                                        >
                                            {isContentExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                                            <span>{isContentExpanded ? t("collapseContent") : t("expandContent")}</span>
                                        </button>
                                    }
                                >
                                    <FormTextarea
                                        rows={isContentExpanded ? undefined : 22}
                                        value={currentItem.content}
                                        className={`font-mono text-xs sm:text-sm leading-relaxed ${
                                            isContentExpanded ? "flex-1 min-h-0 resize-none" : "min-h-[420px] resize-y"
                                        }`}
                                        onChange={(e) =>
                                            updateCurrentItem({ content: e.target.value })
                                        }
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    {/* Resizable Divider */}
                    <div
                        onMouseDown={handleMouseDown}
                        className="hidden lg:block w-1.5 cursor-col-resize bg-transparent hover:bg-accent/40 active:bg-accent/60 transition-colors shrink-0"
                    />

                    {/* Right Column: Live MDX Preview */}
                    <div
                        className={`min-w-0 h-full flex-col bg-background ${
                            mobileTab === "preview" ? "flex w-full" : "hidden"
                        } lg:flex lg:flex-1`}
                    >
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-(--border-color) text-foreground/70">
                            <Eye size={16} />
                            <span className="font-semibold text-sm">{t("previewTitle")}</span>
                            {isRendering && (
                                <span className="ml-auto flex items-center gap-1.5 text-xs text-foreground/50">
                                    <Loader2 size={12} className="animate-spin" />
                                    {t("previewRendering")}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <header className="mb-6 border-b border-(--border-color) pb-4">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">
                                    Documentation · /{currentItem.slug}
                                </span>
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                                    {currentItem.title || t("previewUntitled")}
                                </h1>
                                {currentItem.description && (
                                    <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
                                        {currentItem.description}
                                    </p>
                                )}
                            </header>

                            <div className="prose prose-invert max-w-none pb-8">
                                {mdxSource ? (
                                    <MDXRemote {...mdxSource} components={mdxComponents} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-foreground/40 italic">
                                        <p>{t("previewEmpty")}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* R2 Image Picker Modal */}
            {isPickerOpen && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 sm:p-6"
                    onClick={() => setIsPickerOpen(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={t("pickImageModalTitle")}
                        className="bg-background border border-(--border-color) rounded-lg w-full max-w-5xl h-[80vh] flex flex-col shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
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
                                    insertMarkdownImage(file.publicUrl, file.name);
                                    setIsPickerOpen(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

