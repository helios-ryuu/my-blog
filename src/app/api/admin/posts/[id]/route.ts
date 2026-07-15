import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPostById, updatePost, deletePost } from "@/lib/posts-db";
import { apiSuccess, apiError, handleRouteError, parseIdParam, revalidatePosts } from "@/lib/api-helpers";

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
        const patch = await req.json();
        const supabase = createSupabaseAdminClient();
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
        await deletePost(supabase, id);
        revalidatePosts(existing?.slug);
        return apiSuccess({ id });
    } catch (err) {
        return handleRouteError(err);
    }
}
