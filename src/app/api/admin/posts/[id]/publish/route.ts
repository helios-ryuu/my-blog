import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPostById, setPostPublished } from "@/lib/posts-db";
import { apiError, apiSuccess, HttpError, handleRouteError, parseIdParam, revalidatePosts } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "post id");
        if (id instanceof NextResponse) return id;
        const body = await req.json().catch(() => ({}));
        if (typeof body.published !== "boolean") throw new HttpError(400, "published must be a boolean");
        const published = body.published;
        const supabase = createSupabaseAdminClient();
        if (!await getPostById(supabase, id)) return apiError("Post not found", 404);
        const post = await setPostPublished(supabase, id, published);
        revalidatePosts(post.slug);
        return apiSuccess(post);
    } catch (err) {
        return handleRouteError(err);
    }
}
