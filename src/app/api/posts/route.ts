import { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listPosts } from "@/lib/posts-db";
import type { PostCategory } from "@/types/database";
import { apiSuccess, handleRouteError } from "@/lib/api-helpers";

const getCachedList = unstable_cache(
    async (page: number, pageSize: number, tag?: string, category?: PostCategory, q?: string) => {
        const supabase = createSupabaseAdminClient();
        return listPosts(supabase, { page, pageSize, tag, category, q, publishedOnly: true });
    },
    ["public-posts"],
    { tags: ["posts"], revalidate: 60 },
);

export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;
        const page = parseInt(sp.get("page") ?? "1", 10) || 1;
        const pageSize = parseInt(sp.get("pageSize") ?? "10", 10) || 10;
        const tag = sp.get("tag") ?? undefined;
        const category = (sp.get("category") as PostCategory | null) ?? undefined;
        const q = sp.get("q") ?? undefined;
        const result = await getCachedList(page, pageSize, tag, category, q);
        return apiSuccess(result);
    } catch (err) {
        return handleRouteError(err);
    }
}
