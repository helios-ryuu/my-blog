import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { setPostPublished } from "@/lib/posts-db";
import { apiSuccess, handleRouteError, parseIdParam, revalidatePosts } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "post id");
        if (id instanceof NextResponse) return id;
        const body = await req.json().catch(() => ({}));
        const published = body.published === true;
        const supabase = createSupabaseAdminClient();
        const post = await setPostPublished(supabase, id, published);
        revalidatePosts(post.slug);
        return apiSuccess(post);
    } catch (err) {
        return handleRouteError(err);
    }
}
