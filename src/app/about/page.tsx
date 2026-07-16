import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";
import PageHeader from "@/components/layout/PageHeader";
import PostLevelBadge from "@/components/features/post/card/PostLevelBadge";
import { SOCIAL_LINKS } from "@/config/site";
import { POST_LEVELS } from "@/types/database";
import { listCategories } from "@/lib/categories-db";
import { createSupabasePublicClient } from "@/lib/supabase/public";

const getCachedCategories = unstable_cache(
    async () => listCategories(createSupabasePublicClient()),
    ["about-categories"],
    { revalidate: 300, tags: ["categories"] },
);

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("about");
    return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function AboutPage() {
    const [t, tPost, categories] = await Promise.all([
        getTranslations("about"),
        getTranslations("post"),
        getCachedCategories(),
    ]);

    return (
        <main className="mx-auto max-w-4xl px-4 py-10">
            <PageHeader title={t("title")} description={t("subtitle")} />
            <div className="divide-y divide-(--border-color) border-y border-(--border-color)">
                <section className="grid gap-5 py-7 md:grid-cols-[180px_1fr] md:gap-8">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">{t("aboutTitle")}</h2>
                    <div className="space-y-4 text-sm leading-7 text-foreground/72">
                        <p>{t("paragraphOne")}</p>
                        <p>{t("paragraphTwo")}</p>
                    </div>
                </section>

                <section className="grid gap-5 py-7 md:grid-cols-[180px_1fr] md:gap-8">
                    <div>
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">{t("topicsTitle")}</h2>
                        <p className="mt-2 text-xs leading-5 text-foreground/50">{t("topicsDescription")}</p>
                    </div>
                    <div className="divide-y divide-(--border-color)">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/category/${category.slug}`}
                                className="group grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[180px_1fr] sm:gap-4"
                            >
                                <span className="text-sm font-semibold group-hover:text-accent">
                                    {category.icon && <span aria-hidden="true">{category.icon}{" "}</span>}{category.name}
                                </span>
                                <span className="text-sm leading-6 text-foreground/62">
                                    {category.description}
                                    {category.examples && <span className="block text-xs text-foreground/40">{category.examples}</span>}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="grid gap-5 py-7 md:grid-cols-[180px_1fr] md:gap-8">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">{t("readingGuideTitle")}</h2>
                    <div className="space-y-4 text-sm leading-7 text-foreground/72">
                        <p>{t("readingGuideDescription")}</p>
                        <div className="flex flex-wrap items-center gap-2">
                            {POST_LEVELS.map((level) => <PostLevelBadge key={level} level={level} />)}
                        </div>
                        <p>{t("readingTimeDescription")} <span className="font-semibold text-foreground">{tPost("readingMinutes", { count: 5 })}</span></p>
                    </div>
                </section>

                <section className="grid gap-5 py-7 md:grid-cols-[180px_1fr] md:gap-8">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">{t("contactTitle")}</h2>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm leading-7 text-foreground/72">
                        <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" className="hover:text-accent">GitHub</a>
                        <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-accent">Facebook</a>
                        <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-accent">Instagram</a>
                    </div>
                </section>
            </div>
        </main>
    );
}
