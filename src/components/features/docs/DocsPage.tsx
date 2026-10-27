"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Clock, Download, FileCode2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import TableOfContents from "@/components/features/post/detail/TableOfContents";
import { downloadMdxTemplate } from "@/lib/mdx-frontmatter";
import { useUser } from "@/contexts/UserContext";
import { useAdminCache } from "@/contexts/AdminCacheContext";
import type { DocItem } from "@/data/docs-content";

export interface RenderedDocSection extends DocItem {
    renderedContent: ReactNode;
}

interface DocsPageProps {
    sections: RenderedDocSection[];
}

export default function DocsPage({ sections }: DocsPageProps) {
    const t = useTranslations("docs");
    const { user } = useUser();
    const { setPendingDocsEditorSlug } = useAdminCache();
    const isAdmin = user?.role === "admin";
    const [activeSlug, setActiveSlug] = useState<string>(() => sections[0]?.slug ?? "");

    const activeSection = sections.find((s) => s.slug === activeSlug) ?? sections[0];

    if (!activeSection) {
        return null;
    }

    return (
        <div className="flex flex-col w-full bg-background">
            {/* Mobile Topic Selector & Template Action Bar */}
            <div className="lg:hidden border-b border-(--border-color) bg-background/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <BookOpen size={15} className="text-accent shrink-0" />
                    <select
                        value={activeSection.slug}
                        onChange={(e) => setActiveSlug(e.target.value)}
                        className="h-8 min-w-0 flex-1 rounded-md border border-(--border-color) bg-background px-2.5 text-xs font-medium text-foreground outline-none focus:border-accent"
                    >
                        {sections.map((sec, idx) => (
                            <option key={sec.id || sec.slug} value={sec.slug}>
                                {idx + 1}. {sec.title}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    onClick={() => downloadMdxTemplate("post-template.mdx")}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-2.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors cursor-pointer shrink-0"
                >
                    <Download size={13} />
                    <span>{t("downloadTemplate")}</span>
                </button>
            </div>

            <div className="flex gap-2 px-4 md:px-0 max-w-dvw mx-auto w-full bg-background">
                {/* Left Sidebar: Documentation Navigation Hub */}
                <aside className="hidden lg:block w-68 flex-none border-r border-(--border-color) bg-background">
                    <div className="sticky top-0 h-[calc(100vh-6rem)] flex flex-col justify-between p-4 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="pb-3 border-b border-(--border-color)">
                                <div className="flex items-center gap-2 text-accent font-mono text-xs font-bold uppercase tracking-widest">
                                    <BookOpen size={14} />
                                    <span>{t("hubLabel")}</span>
                                </div>
                                <p className="mt-1 text-xs text-foreground/55 leading-relaxed">
                                    {t("hubSubtitle")}
                                </p>
                            </div>

                            <nav className="space-y-1">
                                <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-foreground/45">
                                    {t("topicsHeader")}
                                </p>
                                {sections.map((sec, idx) => {
                                    const isActive = sec.slug === activeSection.slug;
                                    return (
                                        <button
                                            key={sec.id || sec.slug}
                                            type="button"
                                            onClick={() => {
                                                setActiveSlug(sec.slug);
                                                const main = document.querySelector("main");
                                                if (main) main.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                            className={`w-full flex items-center gap-2.5 rounded-[0.8rem] px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                                                isActive
                                                    ? "bg-accent/15 text-accent font-semibold border border-accent/30"
                                                    : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground border border-transparent"
                                            }`}
                                        >
                                            <span
                                                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[0.375rem] text-[11px] font-mono ${
                                                    isActive
                                                        ? "bg-accent text-white"
                                                        : "bg-foreground/10 text-foreground/60"
                                                }`}
                                            >
                                                {idx + 1}
                                            </span>
                                            <span className="truncate">{sec.title}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Bottom Quick Actions Card */}
                        <div className="space-y-2.5 pt-4 border-t border-(--border-color)">
                            <div className="rounded-lg border border-(--border-color) bg-foreground/[0.03] p-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                    <FileCode2 size={14} className="text-accent" />
                                    <span>{t("templateCardTitle")}</span>
                                </div>
                                <p className="text-[11px] text-foreground/60 leading-relaxed">
                                    {t("templateCardDesc")}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => downloadMdxTemplate("post-template.mdx")}
                                    className="w-full inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-accent px-3 text-xs font-semibold text-white hover:bg-accent/90 transition-colors cursor-pointer"
                                >
                                    <Download size={13} />
                                    <span>{t("downloadTemplate")}</span>
                                </button>
                            </div>

                            {isAdmin && (
                                <Link
                                    href={`/admin?editDocs=${encodeURIComponent(activeSection.slug)}`}
                                    onClick={() => setPendingDocsEditorSlug(activeSection.slug)}
                                    className="w-full inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-(--border-color) bg-background px-3 text-xs font-medium text-foreground/75 hover:border-accent hover:text-accent transition-colors"
                                >
                                    <Pencil size={12} />
                                    <span>{t("editInAdmin")}</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Center: Main MDX Documentation Article */}
                <article className="flex-1 min-w-0 mx-auto py-6 md:py-6 md:px-12 max-w-5xl bg-background">
                    <header className="mb-8 pb-6 border-b border-(--border-color)">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-accent">
                                Docs · /{activeSection.slug}
                            </span>
                            {activeSection.updatedAt && (
                                <span className="inline-flex items-center gap-1 text-xs text-foreground/50">
                                    <Clock size={12} />
                                    {t("lastUpdated", {
                                        date: new Date(activeSection.updatedAt).toLocaleDateString(),
                                    })}
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                            {activeSection.title}
                        </h1>
                        {activeSection.description && (
                            <p className="mt-2 text-sm text-foreground/70 leading-relaxed">
                                {activeSection.description}
                            </p>
                        )}
                    </header>

                    <div className="prose prose-lg dark:prose-invert max-w-none pb-12">
                        {activeSection.renderedContent}
                    </div>
                </article>

                {/* Right Sidebar: Table of Contents */}
                <aside className="hidden xl:block w-68 flex-none border-l border-(--border-color) bg-background">
                    <div className="sticky top-0 h-[calc(100vh-6rem)] overflow-hidden">
                        <TableOfContents content={activeSection.content} />
                    </div>
                </aside>
            </div>
        </div>
    );
}

