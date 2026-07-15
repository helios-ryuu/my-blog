import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listPosts, createPost } from "@/lib/posts-db";
import { apiSuccess, handleRouteError, revalidatePosts } from "@/lib/api-helpers";
import type { PostCategory } from "@/types/database";

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
        const sp = req.nextUrl.searchParams;
        const page = parseInt(sp.get("page") ?? "1", 10) || 1;
        const pageSize = parseInt(sp.get("pageSize") ?? "20", 10) || 20;
        const category = (sp.get("category") as PostCategory | null) ?? undefined;
        const q = sp.get("q") ?? undefined;
        const supabase = createSupabaseAdminClient();
        const result = await listPosts(supabase, { page, pageSize, category, q, publishedOnly: false });
        return apiSuccess(result);
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
        const body = await req.json();
        if (!body.slug || !body.title || !body.description || !body.content) {
            return handleRouteError(new Error("missing required fields"));
        }
        const supabase = createSupabaseAdminClient();
        const post = await createPost(supabase, body);
        revalidatePosts(post.slug);
        return apiSuccess(post);
    } catch (err) {
        return handleRouteError(err);
    }
}
