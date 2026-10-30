"use client";

import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, Newspaper, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function PostError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations("common");
    const tNav = useTranslations("nav");

    useEffect(() => {
        console.error("BlogPostPage error:", error);
    }, [error]);

    return (
        <main className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent border border-accent/30">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-foreground">{t("errorTitle")}</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-foreground/65">{t("errorDescription")}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button
                    type="button"
                    onClick={() => reset()}
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {t("tryAgain")}
                </button>
                <Link
                    href="/post"
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-(--border-color) px-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
                >
                    <Newspaper className="h-4 w-4" aria-hidden="true" />
                    {tNav("posts")}
                </Link>
                <Link
                    href="/"
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-(--border-color) px-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {tNav("home")}
                </Link>
            </div>
        </main>
    );
}

