import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listContests, createContest, replaceStages, type StageInput } from "@/lib/contests-db";
import { apiSuccess, handleRouteError, revalidateContests } from "@/lib/api-helpers";

export async function GET() {
    try {
        await requireAdmin();
        const supabase = createSupabaseAdminClient();
        const contests = await listContests(supabase, { includeAll: true, withStages: true });
        return apiSuccess(contests);
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
        const body = await req.json();
        const supabase = createSupabaseAdminClient();
        const { stages, ...contestInput } = body as { stages?: StageInput[]; [k: string]: unknown };
        const contest = await createContest(supabase, contestInput as unknown as Parameters<typeof createContest>[1]);
        const savedStages = stages && Array.isArray(stages)
            ? await replaceStages(supabase, contest.id, stages)
            : [];
        revalidateContests(contest.slug);
        return apiSuccess({ ...contest, stages: savedStages });
    } catch (err) {
        return handleRouteError(err);
    }
}
