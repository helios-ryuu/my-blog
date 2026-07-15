import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getAllPostsMeta, getAllTags, getAllLevels } from "@/lib/posts";
import { PostListClient } from "@/components/features/post";
import MobileSearchBar from "@/components/layout/MobileSearchBar";
import PageHeader from "@/components/layout/PageHeader";
import type { Level } from "@/types/post";
import { unstable_cache } from "next/cache";

// Cache post list data
const getCachedPostsData = unstable_cache(
    async () => {
        const [posts, allTags, allLevelsRaw] = await Promise.all([
            getAllPostsMeta(),
            getAllTags(),
            getAllLevels()
        ]);

        const allLevels = allLevelsRaw as Level[];

        return { posts, allTags, allLevels };
    },
    ["post-list"],
    { revalidate: 60, tags: ["posts"] }
);

export default async function PostPage() {
    const { posts, allTags, allLevels } = await getCachedPostsData();
    const t = await getTranslations("post");

    return (
        <>
            {/* Mobile Search Bar - below header */}
            <MobileSearchBar />

            <div className="w-full px-4 py-8 md:px-10">
                <div className="mx-auto">
                    <PageHeader title={t("pageTitle")} description={t("pageSubtitle")} />

                    <Suspense fallback={<div>Loading...</div>}>
                        <PostListClient
                            posts={posts}
                            allTags={allTags}
                            allLevels={allLevels}
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
