import { NextRequest } from "next/server";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { getPostBySlug } from "@/lib/posts-db";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await ctx.params;
        const supabase = createSupabasePublicClient();
        const post = await getPostBySlug(supabase, slug);
        if (!post) return apiError("Post not found", 404);
        return apiSuccess(post);
    } catch (err) {
        return handleRouteError(err);
    }
}
