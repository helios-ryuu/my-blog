import { ArrowLeft, FileQuestion, Newspaper } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
    const t = await getTranslations("notFound");

    return (
        <main className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
            <FileQuestion className="h-10 w-10 text-accent" aria-hidden="true" />
            <p className="mt-5 font-mono text-sm text-foreground/50">404</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">{t("title")}</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-foreground/65">{t("description")}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link
                    href="/"
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-(--border-color) px-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
                >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    {t("home")}
                </Link>
                <Link
                    href="/post"
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                >
                    <Newspaper className="h-4 w-4" aria-hidden="true" />
                    {t("posts")}
                </Link>
            </div>
        </main>
    );
}
