import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess, handleRouteError, parseIdParam } from "@/lib/api-helpers";
import { getSeriesById } from "@/lib/series-db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(context.params, "series id");
        if (id instanceof NextResponse) return id;
        const supabase = createSupabaseAdminClient();
        if (!await getSeriesById(supabase, id)) return apiError("Series not found", 404);
        const excludePostId = Number(request.nextUrl.searchParams.get("excludePostId") ?? 0);
        let query = supabase
            .from("post")
            .select("id, title, slug, series_order, published")
            .eq("series_id", id)
            .order("series_order");
        if (Number.isSafeInteger(excludePostId) && excludePostId > 0) query = query.neq("id", excludePostId);
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        const posts = (data ?? []) as Array<{ id: number; title: string; slug: string; series_order: number; published: boolean }>;
        const existingOrders = posts.map((post) => post.series_order);
        const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 1;
        return apiSuccess({ posts, existingOrders, nextOrder });
    } catch (error) {
        return handleRouteError(error);
    }
}
