import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPostBySlug } from "@/lib/posts-db";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await ctx.params;
        const supabase = createSupabaseAdminClient();
        const post = await getPostBySlug(supabase, slug);
        if (!post) return apiError("Post not found", 404);
        return apiSuccess(post);
    } catch (err) {
        return handleRouteError(err);
    }
}
