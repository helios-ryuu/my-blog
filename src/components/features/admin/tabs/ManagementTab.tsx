"use client";

import { useState } from "react";
import Link from "next/link";
import {
    BookOpen,
    BookOpenCheck,
    Download,
    Edit2,
    ExternalLink,
    FilePlus,
    FileText,
    FileUp,
    Pencil,
    Plus,
    RefreshCw,
    Tag,
    Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DraftPostsSection from "../sections/DraftPostsSection";
import CategoryManagementSection from "../sections/CategoryManagementSection";
import PostAdvancedSelector from "../common/PostAdvancedSelector";
import SeriesAdvancedSelector from "../common/SeriesAdvancedSelector";
import TagAdvancedSelector from "../common/TagAdvancedSelector";
import { Button } from "../common/Button";
import { downloadMdxTemplate } from "@/lib/mdx-frontmatter";
import type { DocsConfig } from "@/data/docs-content";
import type {
    AdminCategory,
    AdminPost,
    AdminSeries,
    AdminTag,
    DeleteConfirmData,
} from "@/types/admin";

interface ManagementTabProps {
    posts: AdminPost[];
    tags: AdminTag[];
    categories: AdminCategory[];
    docsConfig: DocsConfig;
    isLoading: boolean;
    loadedTime: string | null;
    onRefresh: () => void;
    onAddPost: () => void;
    onOpenUploadPost: () => void;
    onOpenDocsEditor: (slug?: string) => void;
    onAddTag: () => void;
    onAddSeries: () => void;
    onEditPost: (id: number) => void;
    onEditTag: (tag: AdminTag) => void;
    onEditSeries: (series: AdminSeries) => void;
    onDeleteConfirm: (data: DeleteConfirmData) => void;
    onShowToast?: (type: "success" | "error" | "info" | "warning", message: string) => void;
}

export default function ManagementTab({
    posts,
    tags,
    categories,
    docsConfig,
    isLoading,
    loadedTime,
    onRefresh,
    onAddPost,
    onOpenUploadPost,
    onOpenDocsEditor,
    onAddTag,
    onAddSeries,
    onEditPost,
    onEditTag,
    onEditSeries,
    onDeleteConfirm,
    onShowToast,
}: ManagementTabProps) {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");

    const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);
    const [selectedSeries, setSelectedSeries] = useState<AdminSeries | null>(null);
    const [selectedTag, setSelectedTag] = useState<AdminTag | null>(null);

    const refreshLabel = loadedTime
        ? `${tCommon("refresh")} • ${loadedTime}`
        : tCommon("refresh");

    return (
        <div className="rounded-xl border border-(--border-color) bg-background/50 backdrop-blur-xs p-5 md:p-6 shadow-xs space-y-8">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-(--border-color)/70">
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        {t("managementTitle")}
                    </h2>
                    <p className="text-xs text-foreground/55 mt-0.5">
                        {t("managementSubtitle")}
                    </p>
                </div>
                <Button
                    variant="utility"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading ? true : undefined}
                    isLoading={isLoading}
                    loadingText={tCommon("loading")}
                    icon={<RefreshCw size={14} />}
                >
                    {refreshLabel}
                </Button>
            </div>

            {/* ── GROUP 1: POSTS & DRAFTS ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                        {t("postsSectionTitle")}
                    </h3>
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                        {posts.length}
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                    {/* Card 1: Create Post */}
                    <button
                        type="button"
                        onClick={onAddPost}
                        className="lg:col-span-3 flex flex-col justify-between rounded-xl border border-accent/30 bg-accent/12 p-4 text-left transition-all hover:bg-accent/20 hover:border-accent/50 cursor-pointer group"
                    >
                        <div>
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/25 text-accent">
                                <FilePlus size={20} />
                            </div>
                            <h4 className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors">
                                {t("createPost")}
                            </h4>
                            <p className="mt-1 text-xs text-foreground/65 leading-relaxed">
                                {t("createPostDesc")}
                            </p>
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent">
                            <Plus size={13} />
                            {t("openEditorAction")}
                        </span>
                    </button>

                    {/* Card 2: Upload Post (.mdx) + Download Template */}
                    <div className="lg:col-span-4 flex flex-col justify-between rounded-xl border border-(--border-color) bg-foreground/[0.03] p-4">
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                                        <FileUp size={18} />
                                    </div>
                                    <h4 className="font-semibold text-sm text-foreground">
                                        {t("uploadPostTitle")}
                                    </h4>
                                </div>
                                <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-500">
                                    Draft
                                </span>
                            </div>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                {t("uploadPostCardDesc")}
                            </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={onOpenUploadPost}
                                className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-accent px-3 text-xs font-semibold text-white hover:bg-accent/90 transition-colors cursor-pointer"
                            >
                                <FileUp size={13} />
                                <span>{t("uploadPostBtn")}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => downloadMdxTemplate("post-template.mdx")}
                                title={t("downloadMdxTemplate")}
                                className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-(--border-color) bg-background px-2.5 text-xs font-medium text-foreground/75 hover:border-accent hover:text-accent transition-colors cursor-pointer"
                            >
                                <Download size={13} />
                                <span>Template</span>
                            </button>
                        </div>
                    </div>

                    {/* Card 3: Unified Find / Edit / Delete Post */}
                    <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-(--border-color) bg-foreground/[0.03] p-4 space-y-3">
                        <div>
                            <h4 className="font-semibold text-sm text-foreground">
                                {t("manageExistingPostTitle")}
                            </h4>
                            <p className="mt-0.5 text-xs text-foreground/60">
                                {t("manageExistingPostDesc")}
                            </p>
                        </div>

                        <PostAdvancedSelector
                            value={selectedPost}
                            tags={tags}
                            categories={categories}
                            onChange={setSelectedPost}
                        />

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                disabled={!selectedPost}
                                onClick={() => selectedPost && onEditPost(selectedPost.id)}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Edit2 size={13} />
                                <span>{tCommon("edit")}</span>
                            </button>
                            <button
                                type="button"
                                disabled={!selectedPost}
                                onClick={() => {
                                    if (!selectedPost) return;
                                    onDeleteConfirm({
                                        type: "post",
                                        id: selectedPost.id,
                                        name: selectedPost.title,
                                        slug: selectedPost.slug,
                                        category: selectedPost.category,
                                        published: selectedPost.published,
                                        tags: selectedPost.tags?.map((postTag) => postTag.name),
                                    });
                                }}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-red-500/35 bg-red-500/10 px-3 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Trash2 size={13} />
                                <span>{tCommon("delete")}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Draft Posts Pill Row */}
                <DraftPostsSection
                    posts={posts}
                    categories={categories}
                    isLoading={isLoading}
                    onEditDraft={onEditPost}
                    onPublished={onRefresh}
                    onShowToast={onShowToast}
                />
            </section>

            <hr className="border-(--border-color)/70" />

            {/* ── GROUP 2: TAXONOMY (CATEGORIES, SERIES & TAGS) ── */}
            <section className="space-y-6">
                <CategoryManagementSection
                    categories={categories}
                    isLoading={isLoading}
                    onRefresh={onRefresh}
                    onShowToast={onShowToast ?? (() => undefined)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Unified Series Card */}
                    <div className="rounded-xl border border-(--border-color) bg-foreground/[0.03] p-4 space-y-3 flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
                                        <BookOpen size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">
                                            {t("seriesManagementTitle")}
                                        </h4>
                                        <p className="text-xs text-foreground/55">
                                            {selectedSeries?.post_count
                                                ? t("seriesDeleteBlocked", { count: selectedSeries.post_count })
                                                : t("seriesManagementDesc")}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    icon={<Plus size={13} />}
                                    onClick={onAddSeries}
                                >
                                    {tCommon("create")}
                                </Button>
                            </div>

                            <SeriesAdvancedSelector value={selectedSeries} onChange={setSelectedSeries} />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                                type="button"
                                disabled={!selectedSeries}
                                onClick={() => selectedSeries && onEditSeries(selectedSeries)}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Edit2 size={13} />
                                <span>{tCommon("edit")}</span>
                            </button>
                            <button
                                type="button"
                                disabled={!selectedSeries || selectedSeries.post_count > 0}
                                onClick={() =>
                                    selectedSeries &&
                                    onDeleteConfirm({
                                        type: "series",
                                        id: selectedSeries.id,
                                        name: selectedSeries.name,
                                        slug: selectedSeries.slug,
                                        postCount: selectedSeries.post_count,
                                    })
                                }
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-red-500/35 bg-red-500/10 px-3 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Trash2 size={13} />
                                <span>{tCommon("delete")}</span>
                            </button>
                        </div>
                    </div>

                    {/* Unified Tags Card */}
                    <div className="rounded-xl border border-(--border-color) bg-foreground/[0.03] p-4 space-y-3 flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
                                        <Tag size={16} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-sm font-semibold text-foreground">
                                                {t("tagsManagementTitle")}
                                            </h4>
                                            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.2 text-[10px] font-medium text-blue-400">
                                                {tags.length}
                                            </span>
                                        </div>
                                        <p className="text-xs text-foreground/55">
                                            {t("tagsManagementDesc")}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    icon={<Plus size={13} />}
                                    onClick={onAddTag}
                                >
                                    {tCommon("create")}
                                </Button>
                            </div>

                            <TagAdvancedSelector value={selectedTag} tags={tags} onChange={setSelectedTag} />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                                type="button"
                                disabled={!selectedTag}
                                onClick={() => selectedTag && onEditTag(selectedTag)}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-blue-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Edit2 size={13} />
                                <span>{tCommon("edit")}</span>
                            </button>
                            <button
                                type="button"
                                disabled={!selectedTag}
                                onClick={() => {
                                    if (!selectedTag) return;
                                    onDeleteConfirm({
                                        type: "tag",
                                        id: selectedTag.id,
                                        name: selectedTag.name,
                                        slug: selectedTag.slug,
                                    });
                                }}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-red-500/35 bg-red-500/10 px-3 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <Trash2 size={13} />
                                <span>{tCommon("delete")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <hr className="border-(--border-color)/70" />

            {/* ── GROUP 3: SYSTEM DOCUMENTATION (/docs) ── */}
            <section className="space-y-3">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <BookOpenCheck className="h-4 w-4 text-accent" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                                {t("docsSectionTitle")}
                            </h3>
                            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                                {docsConfig.items.length}
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-foreground/60 leading-relaxed">
                            {t("docsSectionDesc")}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href="/docs"
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-color) bg-background px-3 text-xs font-medium text-foreground/75 hover:border-accent hover:text-accent transition-colors"
                        >
                            <ExternalLink size={13} />
                            <span>{t("viewDocsPage")}</span>
                        </Link>
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            icon={<Pencil size={13} />}
                            onClick={() => onOpenDocsEditor()}
                        >
                            {t("editDocsBtn")}
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto rounded-lg border border-(--border-color)/80 bg-background/40 p-2.5 scrollbar-thin">
                    <span className="shrink-0 text-xs font-semibold text-foreground/70">
                        {t("docsTopicsLabel")}:
                    </span>
                    {docsConfig.items.map((item, idx) => (
                        <button
                            key={item.id || item.slug}
                            type="button"
                            onClick={() => onOpenDocsEditor(item.slug)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-(--border-color) bg-background px-2.5 py-1 text-xs text-foreground/85 hover:border-accent hover:bg-accent/10 hover:text-foreground transition-all cursor-pointer shadow-2xs"
                        >
                            <span className="rounded-full bg-accent/15 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-accent">
                                {idx + 1}
                            </span>
                            <span className="font-medium">{item.title}</span>
                            <span className="font-mono text-[10px] text-foreground/50">
                                /{item.slug}
                            </span>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
