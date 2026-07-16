import { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { listPosts } from "@/lib/posts-db";
import {
    POST_LEVELS,
    POST_TYPES,
    type PostLevel,
    type PostType,
} from "@/types/database";
import { apiSuccess, apiError, handleRouteError, HttpError } from "@/lib/api-helpers";

const getCachedList = unstable_cache(
    async (page: number, pageSize: number, tag?: string, category?: string, level?: PostLevel, type?: PostType, q?: string) => {
        const supabase = createSupabasePublicClient();
        return listPosts(supabase, { page, pageSize, tag, category, level, type, q, publishedOnly: true });
    },
    ["public-posts"],
    { tags: ["posts"], revalidate: 60 },
);

export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;
        const page = parseInt(sp.get("page") ?? "1", 10) || 1;
        const pageSize = parseInt(sp.get("pageSize") ?? "10", 10) || 10;
        const tag = sp.get("tag")?.trim() || undefined;
        const requestedCategory = sp.get("category");
        if (requestedCategory && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requestedCategory) || requestedCategory.length > 100)) {
            return apiError("Invalid category", 400);
        }
        const category = requestedCategory || undefined;
        const requestedLevel = sp.get("level");
        if (requestedLevel && !POST_LEVELS.includes(requestedLevel as PostLevel)) {
            return apiError("Invalid level", 400);
        }
        const level = requestedLevel ? requestedLevel as PostLevel : undefined;
        const requestedType = sp.get("type");
        if (requestedType && !POST_TYPES.includes(requestedType as PostType)) {
            return apiError("Invalid type", 400);
        }
        const type = requestedType ? requestedType as PostType : undefined;
        const q = sp.get("q")?.trim() || undefined;
        if (tag && tag.length > 100) throw new HttpError(400, "Tag slug is too long");
        if (q && q.length > 100) throw new HttpError(400, "Search query is too long");
        const result = await getCachedList(page, pageSize, tag, category, level, type, q);
        return apiSuccess(result);
    } catch (err) {
        return handleRouteError(err);
    }
}
