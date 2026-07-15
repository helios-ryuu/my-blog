import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateStage, deleteStage, getContestById } from "@/lib/contests-db";
import { apiSuccess, apiError, handleRouteError, revalidateContests } from "@/lib/api-helpers";

async function parseIds(params: Promise<{ id: string; stageId: string }>): Promise<{ contestId: number; stageId: number } | NextResponse> {
    const { id, stageId } = await params;
    const cId = parseInt(id, 10);
    const sId = parseInt(stageId, 10);
    if (Number.isNaN(cId) || Number.isNaN(sId)) return apiError("Invalid id", 400);
    return { contestId: cId, stageId: sId };
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; stageId: string }> }) {
    try {
        await requireAdmin();
        const ids = await parseIds(ctx.params);
        if (ids instanceof NextResponse) return ids;
        const body = await req.json();
        const supabase = createSupabaseAdminClient();
        const stage = await updateStage(supabase, ids.stageId, body);
        const contest = await getContestById(supabase, ids.contestId);
        revalidateContests(contest?.slug);
        return apiSuccess(stage);
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; stageId: string }> }) {
    try {
        await requireAdmin();
        const ids = await parseIds(ctx.params);
        if (ids instanceof NextResponse) return ids;
        const supabase = createSupabaseAdminClient();
        await deleteStage(supabase, ids.stageId);
        const contest = await getContestById(supabase, ids.contestId);
        revalidateContests(contest?.slug);
        return apiSuccess({ id: ids.stageId });
    } catch (err) {
        return handleRouteError(err);
    }
}
