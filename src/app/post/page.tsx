import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getAllPostsMeta, getAllTags } from "@/lib/posts";
import { PostListClient } from "@/components/features/post";
import MobileSearchBar from "@/components/layout/MobileSearchBar";
import PageHeader from "@/components/layout/PageHeader";
import { unstable_cache } from "next/cache";
import { listCategories } from "@/lib/categories-db";
import { createSupabasePublicClient } from "@/lib/supabase/public";

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
        <>
            {/* Mobile Search Bar - below header */}
            <MobileSearchBar />

            <div className="w-full px-4 py-8 md:px-10">
                <div className="mx-auto">
                    <PageHeader title={t("pageTitle")} description={t("pageSubtitle")} />

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
        </>
    );
}
