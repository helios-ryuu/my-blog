import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PostCard } from "@/components/features/post";
import PageHeader from "@/components/layout/PageHeader";
import { getCategoryBySlug } from "@/lib/categories-db";
import { listPosts } from "@/lib/posts-db";
import { createSupabasePublicClient } from "@/lib/supabase/public";

interface Props {
    params: Promise<{ type: string }>;
}

const getCachedCategory = unstable_cache(
    async (slug: string) => {
        const supabase = createSupabasePublicClient();
        const category = await getCategoryBySlug(supabase, slug);
        if (!category) return null;
        const { items } = await listPosts(supabase, {
            category: slug,
            publishedOnly: true,
            pageSize: 50,
        });
        return { category, items };
    },
    ["category-posts"],
    { revalidate: 60, tags: ["posts", "categories"] },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { type } = await params;
    const data = await getCachedCategory(type);
    if (!data) return { title: "Không tìm thấy" };
    return { title: data.category.name, description: data.category.description };
}

export default async function CategoryPage({ params }: Props) {
    const { type } = await params;
    const [data, t] = await Promise.all([
        getCachedCategory(type),
        getTranslations("categoryPage"),
    ]);
    if (!data) notFound();

    const { category, items } = data;
    return (
        <div className="w-full px-4 py-8 md:px-10">
            <div className="mx-auto max-w-6xl">
                <div className="mb-1 flex items-center gap-3">
                    <Link href="/post" className="text-xs text-foreground/60 transition-colors hover:text-accent">
                        ← {t("back")}
                    </Link>
                </div>
                <PageHeader
                    title={category.icon ? `${category.icon} ${category.name}` : category.name}
                    description={category.description}
                    className="mt-2"
                />
                {category.examples && (
                    <p className="mt-3 text-xs text-foreground/50">{t("examples", { examples: category.examples })}</p>
                )}

                {items.length === 0 ? (
                    <p className="mt-6 text-foreground/50">{t("empty")}</p>
                ) : (
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {items.map((post) => {
                            const date = post.published_at ?? post.created_at;
                            return (
                                <PostCard
                                    key={post.id}
                                    slug={post.slug}
                                    image={post.image_url ?? undefined}
                                    title={post.title}
                                    description={post.description}
                                    date={new Date(date).toISOString().split("T")[0]}
                                    readingTime={post.reading_time}
                                    level={post.level}
                                    tags={post.tags.map((tag) => tag.name)}
                                    category={post.category}
                                    categoryName={category.name}
                                    categoryIcon={category.icon}
                                    type={post.series_id ? "series" : "standalone"}
                                    series={post.series}
                                    seriesOrder={post.series_order}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
