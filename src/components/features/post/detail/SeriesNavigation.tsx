"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PostMeta } from "@/types/post";

interface SeriesNavigationProps {
    currentSlug: string;
    posts: PostMeta[];
}

export default function SeriesNavigation({ currentSlug, posts }: SeriesNavigationProps) {
    const t = useTranslations("post");
    if (posts.length <= 1) return null;
    const currentIndex = posts.findIndex((post) => post.slug === currentSlug);
    if (currentIndex < 0) return null;
    const current = posts[currentIndex];
    const previous = posts[currentIndex - 1];
    const next = posts[currentIndex + 1];

    return (
        <nav className="mt-8 border-y border-(--border-color) py-5" aria-label={t("seriesNavigation")}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">{t("typeSeries")}</p>
                    <p className="mt-1 text-sm font-semibold">{current.series?.name}</p>
                </div>
                <span className="text-xs text-foreground/55">{t("seriesPartOf", { part: currentIndex + 1, total: posts.length })}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                {previous ? (
                    <Link href={`/post/${previous.slug}`} className="group rounded-md border border-(--border-color) p-3 transition-colors hover:border-accent/60">
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/45"><ArrowLeft className="h-3 w-3" />{t("seriesPrevious")}</span>
                        <span className="mt-1 block line-clamp-2 text-sm font-medium group-hover:text-accent">{previous.title}</span>
                    </Link>
                ) : <div />}
                {next && (
                    <Link href={`/post/${next.slug}`} className="group rounded-md border border-(--border-color) p-3 text-right transition-colors hover:border-accent/60">
                        <span className="flex items-center justify-end gap-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">{t("seriesNext")}<ArrowRight className="h-3 w-3" /></span>
                        <span className="mt-1 block line-clamp-2 text-sm font-medium group-hover:text-accent">{next.title}</span>
                    </Link>
                )}
            </div>
        </nav>
    );
}
