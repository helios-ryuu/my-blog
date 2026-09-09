import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getAllPostsMeta, getAllTags } from "@/lib/posts";
import { PostListClient } from "@/components/features/post";
import { unstable_cache } from "next/cache";
import { listCategories } from "@/lib/categories-db";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import PageHeader from "@/components/layout/PageHeader";

// Cache post list data
const getCachedPostsData = unstable_cache(
    async () => {
        const [posts, allTags, allCategories] = await Promise.all([
            getAllPostsMeta(),
            getAllTags(),
            listCategories(createSupabasePublicClient()),
        ]);
        return { posts, allTags, allCategories };
    },
    ["post-list"],
    { revalidate: 60, tags: ["posts", "categories"] }
);

export default async function PostPage() {
    const { posts, allTags, allCategories } = await getCachedPostsData();
    const t = await getTranslations("post");

    return (
        <div className="relative min-h-screen w-full px-3 pb-4 md:px-18">
            <div className="relative z-10 mx-auto">
                <PageHeader
                    title={t("postLabel")}
                    className="mt-4 md:mt-10 mb-3"
                    titleClassName="text-xl md:text-2xl"
                />

                <Suspense fallback={<div className="text-sm text-foreground/60">{t("loading")}</div>}>
                    <PostListClient
                        posts={posts}
                        allTags={allTags}
                        allCategories={allCategories}
                    />
                </Suspense>

                {posts.length === 0 && (
                    <p className="mt-6 text-foreground/50">{t("emptyState")}</p>
                )}
            </div>
        </div>
    );
}
