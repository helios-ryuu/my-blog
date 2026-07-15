import { unstable_cache } from "next/cache";
import { getAllPostsMeta, getAllTags } from "@/lib/posts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listContests } from "@/lib/contests-db";
import { apiSuccess, apiError } from "@/lib/api-helpers";

// Cache search data for 60 seconds to reduce database calls
const getCachedSearchData = unstable_cache(
    async () => {
        const supabase = createSupabaseAdminClient();
        const [posts, allTags, contests] = await Promise.all([
            getAllPostsMeta(),
            getAllTags(),
            listContests(supabase),
        ]);

        const searchableItems = posts.map((post) => ({
            type: "post" as const,
            title: post.title,
            path: `/post/${post.slug}`,
            description: post.description,
            tags: post.tags || [],
        }));

        const contestItems = contests.map((contest) => ({
            type: "contest" as const,
            title: contest.title,
            path: `/contests/${contest.slug}`,
            description: contest.description,
            tags: [] as string[],
        }));

        const tagItems = allTags.map((tag) => ({
            type: "tag" as const,
            title: tag,
            path: `/post?tag=${encodeURIComponent(tag)}`,
            tags: [] as string[],
        }));

        return { posts: searchableItems, contests: contestItems, tags: tagItems };
    },
    ["search-data"],
    { revalidate: 60 }
);

export async function GET() {
    try {
        const data = await getCachedSearchData();
        return apiSuccess(data);
    } catch (error) {
        console.error("Search API error:", error);
        return apiError("Search unavailable", 500);
    }
}
