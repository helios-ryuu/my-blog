"use client";

import { useMemo } from "react";
import { marked } from "marked";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface ProfileReadmeProps {
    markdown: string;
}

export default function ProfileReadme({ markdown }: ProfileReadmeProps) {
    const t = useTranslations("profile");

    const htmlContent = useMemo(() => {
        try {
            return marked.parse(markdown, { gfm: true, breaks: true }) as string;
        } catch {
            return `<p>${t("parseError")}</p>`;
        }
    }, [markdown, t]);

    return (
        <div className="relative rounded-2xl border border-(--border-color)/70 bg-background/60 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
            {/* Header action bar */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-(--border-color)/60">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent border border-accent/25">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                    </span>
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">{t("title")}</h2>
                        <p className="text-[11px] text-foreground/50">{t("fromRepo")}</p>
                    </div>
                </div>

                <Link
                    href="https://github.com/helios-ryuu/helios-ryuu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-(--border-color) bg-background/50 px-3 py-1 text-xs font-medium text-foreground/70 hover:text-accent hover:border-accent/40 transition-colors"
                >
                    <span>{t("viewOnGitHub")}</span>
                    <ExternalLink className="h-3 w-3" />
                </Link>
            </div>

            {/* Readme Content Container */}
            <div
                className="profile-readme-prose prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground/90 overflow-x-auto leading-relaxed
                [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-sm
                [&_th]:text-left [&_th]:p-3 [&_th]:border-b [&_th]:border-(--border-color) [&_th]:font-semibold [&_th]:text-foreground
                [&_td]:p-3 [&_td]:border-b [&_td]:border-(--border-color)/40
                [&_h1]:text-2xl sm:[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mb-2 [&_h1]:mt-0
                [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3
                [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-accent [&_h3]:mt-4 [&_h3]:mb-2
                [&_blockquote]:border-l-4 [&_blockquote]:border-accent/50 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-foreground/75 [&_blockquote]:my-3
                [&_img]:inline-block [&_img]:max-w-full [&_img]:h-auto [&_img]:align-middle
                [&_a]:text-accent [&_a]:underline-offset-4 hover:[&_a]:underline
                [&_picture]:block [&_picture]:w-full [&_picture]:my-4
                "
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </div>
    );
}
