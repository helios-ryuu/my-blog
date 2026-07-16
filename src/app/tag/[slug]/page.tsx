import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { listPosts } from "@/lib/posts-db";
import { PostCard } from "@/components/features/post";
import PageHeader from "@/components/layout/PageHeader";
import { listCategories } from "@/lib/categories-db";

interface Props {
    params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

const getCachedTagPosts = unstable_cache(
    async (slug: string) => {
        const supabase = createSupabasePublicClient();
        const { data: tagRow } = await supabase
            .from("tag")
            .select("id, name, slug")
            .eq("slug", slug)
            .maybeSingle();
        if (!tagRow) return null;
        const [{ items }, categories] = await Promise.all([
            listPosts(supabase, { tag: slug, publishedOnly: true, pageSize: 50 }),
            listCategories(supabase),
        ]);
        return { tag: tagRow as { id: number; name: string; slug: string }, items, categories };
    },
    ["tag-posts"],
    { revalidate: 60, tags: ["posts", "tags", "categories"] },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const [data, t] = await Promise.all([getCachedTagPosts(slug), getTranslations("tagPage")]);
    if (!data) return { title: t("notFound") };
    return {
        title: `Tag: ${data.tag.name}`,
        description: t("description", { tag: data.tag.name }),
    };
}

export default async function TagPage({ params }: Props) {
    const { slug } = await params;
    const [data, t] = await Promise.all([getCachedTagPosts(slug), getTranslations("tagPage")]);

    if (!data) {
        notFound();
    }

    const { tag, items, categories } = data;
    const categoryMap = new Map(categories.map((category) => [category.slug, category]));

    return (
        <div className="w-full px-4 py-8 md:px-10">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-1">
                    <Link href="/post" className="text-xs text-foreground/60 hover:text-accent transition-colors">
                        ← {t("back")}
                    </Link>
                </div>
                <PageHeader
                    title={`#${tag.name}`}
                    description={t("count", { count: items.length })}
                    className="mt-2"
                />

                {items.length === 0 ? (
                    <p className="mt-6 text-foreground/50">{t("empty")}</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {items.map((p) => {
                            const date = p.published_at ?? p.created_at;
                            const category = categoryMap.get(p.category);
                            return (
                                <PostCard
                                    key={p.id}
                                    slug={p.slug}
                                    image={p.image_url ?? undefined}
                                    title={p.title}
                                    description={p.description}
                                    date={new Date(date).toISOString().split("T")[0]}
                                    readingTime={p.reading_time}
                                    level={p.level}
                                    tags={p.tags.map((tagItem) => tagItem.name)}
                                    category={p.category}
                                    categoryName={category?.name}
                                    categoryIcon={category?.icon}
                                    type={p.series_id ? "series" : "standalone"}
                                    series={p.series}
                                    seriesOrder={p.series_order}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
