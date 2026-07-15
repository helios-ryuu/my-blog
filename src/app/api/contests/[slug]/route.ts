import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getContestBySlug } from "@/lib/contests-db";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await ctx.params;
        const supabase = createSupabaseAdminClient();
        const contest = await getContestBySlug(supabase, slug);
        if (!contest) return apiError("Contest not found", 404);
        return apiSuccess(contest);
    } catch (err) {
        return handleRouteError(err);
    }
}
