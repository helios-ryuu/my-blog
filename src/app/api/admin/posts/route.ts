import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listPosts, createPost } from "@/lib/posts-db";
import { apiSuccess, handleRouteError, HttpError, revalidatePosts } from "@/lib/api-helpers";
import { parsePostCreateInput } from "@/lib/content-validation";
import { tagIdsExist } from "@/lib/tags-db";
import { categorySlugExists } from "@/lib/categories-db";
import { POST_LEVELS, POST_TYPES, type PostLevel, type PostType } from "@/types/database";
import { validateSeriesAssignment } from "@/lib/post-series";

const CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
        const sp = req.nextUrl.searchParams;
        const page = parseInt(sp.get("page") ?? "1", 10) || 1;
        const pageSize = parseInt(sp.get("pageSize") ?? "20", 10) || 20;
        const requestedCategory = sp.get("category");
        if (requestedCategory && (!CATEGORY_SLUG_PATTERN.test(requestedCategory) || requestedCategory.length > 100)) {
            throw new HttpError(400, "Invalid post category");
        }
        const category = requestedCategory || undefined;
        const status = sp.get("status");
        if (status && status !== "published" && status !== "draft") {
            throw new HttpError(400, "Invalid publication status");
        }
        const published = status === "published" ? true : status === "draft" ? false : undefined;
        const requestedLevel = sp.get("level");
        if (requestedLevel && !POST_LEVELS.includes(requestedLevel as PostLevel)) {
            throw new HttpError(400, "Invalid post level");
        }
        const level = requestedLevel ? requestedLevel as PostLevel : undefined;
        const requestedType = sp.get("type");
        if (requestedType && !POST_TYPES.includes(requestedType as PostType)) {
            throw new HttpError(400, "Invalid post type");
        }
        const type = requestedType ? requestedType as PostType : undefined;
        const tag = sp.get("tag")?.trim() || undefined;
        const q = sp.get("q")?.trim() || undefined;
        if (tag && tag.length > 100) throw new HttpError(400, "Tag slug is too long");
        if (q && q.length > 100) throw new HttpError(400, "Search query is too long");
        const supabase = createSupabaseAdminClient();
        const result = await listPosts(supabase, {
            page,
            pageSize,
            category,
            level,
            type,
            q,
            tag,
            published,
            publishedOnly: false,
        });
        return apiSuccess(result);
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
        const body = parsePostCreateInput(await req.json().catch(() => null));
        const supabase = createSupabaseAdminClient();
        if (body.tag_ids && !await tagIdsExist(supabase, body.tag_ids)) {
            throw new HttpError(400, "One or more tags do not exist");
        }
        if (!await categorySlugExists(supabase, body.category ?? "articles")) {
            throw new HttpError(400, "Post category does not exist");
        }
        await validateSeriesAssignment(supabase, body.series_id ?? null, body.series_order ?? null);
        const post = await createPost(supabase, body);
        revalidatePosts(post.slug);
        return apiSuccess(post);
    } catch (err) {
        return handleRouteError(err);
    }
}
