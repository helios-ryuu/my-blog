import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
    getContestWithStagesById,
    getContestById,
    updateContest,
    deleteContest,
    replaceStages,
    type StageInput,
} from "@/lib/contests-db";
import { apiSuccess, apiError, handleRouteError, parseIdParam, revalidateContests } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "contest id");
        if (id instanceof NextResponse) return id;
        const supabase = createSupabaseAdminClient();
        const contest = await getContestWithStagesById(supabase, id);
        if (!contest) return apiError("Contest not found", 404);
        return apiSuccess(contest);
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "contest id");
        if (id instanceof NextResponse) return id;
        const body = await req.json();
        const supabase = createSupabaseAdminClient();
        const { stages, ...patch } = body as { stages?: StageInput[]; [k: string]: unknown };
        const contest = await updateContest(supabase, id, patch as unknown as Parameters<typeof updateContest>[2]);
        const savedStages = stages && Array.isArray(stages)
            ? await replaceStages(supabase, id, stages)
            : undefined;
        revalidateContests(contest.slug);
        return apiSuccess({ ...contest, ...(savedStages !== undefined ? { stages: savedStages } : {}) });
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "contest id");
        if (id instanceof NextResponse) return id;
        const supabase = createSupabaseAdminClient();
        const existing = await getContestById(supabase, id);
        await deleteContest(supabase, id);
        revalidateContests(existing?.slug);
        return apiSuccess({ id });
    } catch (err) {
        return handleRouteError(err);
    }
}
