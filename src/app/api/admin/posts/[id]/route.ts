import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPostById, updatePost, deletePost } from "@/lib/posts-db";
import { apiSuccess, apiError, handleRouteError, HttpError, parseIdParam, revalidatePosts } from "@/lib/api-helpers";
import { parsePostPatchInput } from "@/lib/content-validation";
import { tagIdsExist } from "@/lib/tags-db";
import { categorySlugExists } from "@/lib/categories-db";
import { validateSeriesAssignment } from "@/lib/post-series";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "post id");
        if (id instanceof NextResponse) return id;
        const supabase = createSupabaseAdminClient();
        const post = await getPostById(supabase, id);
        if (!post) return apiError("Post not found", 404);
        return apiSuccess(post);
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "post id");
        if (id instanceof NextResponse) return id;
        const patch = parsePostPatchInput(await req.json().catch(() => null));
        const supabase = createSupabaseAdminClient();
        const existing = await getPostById(supabase, id);
        if (!existing) return apiError("Post not found", 404);
        if (patch.tag_ids && !await tagIdsExist(supabase, patch.tag_ids)) {
            throw new HttpError(400, "One or more tags do not exist");
        }
        if (patch.category && !await categorySlugExists(supabase, patch.category)) {
            throw new HttpError(400, "Post category does not exist");
        }
        const seriesId = patch.series_id !== undefined ? patch.series_id : existing.series_id;
        const seriesOrder = patch.series_order !== undefined ? patch.series_order : existing.series_order;
        await validateSeriesAssignment(supabase, seriesId ?? null, seriesOrder ?? null, id);
        const post = await updatePost(supabase, id, patch);
        revalidatePosts(post.slug);
        return apiSuccess(post);
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "post id");
        if (id instanceof NextResponse) return id;
        const supabase = createSupabaseAdminClient();
        const existing = await getPostById(supabase, id);
        if (!existing) return apiError("Post not found", 404);
        await deletePost(supabase, id);
        revalidatePosts(existing?.slug);
        return apiSuccess({ id });
    } catch (err) {
        return handleRouteError(err);
    }
}
