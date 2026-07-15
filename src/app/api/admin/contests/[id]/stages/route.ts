import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listStages, createStage, getContestById } from "@/lib/contests-db";
import { apiSuccess, apiError, handleRouteError, parseIdParam, revalidateContests } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "contest id");
        if (id instanceof NextResponse) return id;
        const supabase = createSupabaseAdminClient();
        const stages = await listStages(supabase, id);
        return apiSuccess(stages);
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "contest id");
        if (id instanceof NextResponse) return id;
        const supabase = createSupabaseAdminClient();
        const body = await req.json();
        const stage = await createStage(supabase, id, body);
        const contest = await getContestById(supabase, id);
        if (!contest) return apiError("Contest not found", 404);
        revalidateContests(contest.slug);
        return apiSuccess(stage);
    } catch (err) {
        return handleRouteError(err);
    }
}
