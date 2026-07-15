import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listContests } from "@/lib/contests-db";
import type { ContestStatus } from "@/types/database";
import { apiSuccess, handleRouteError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
    try {
        const sp = req.nextUrl.searchParams;
        const status = (sp.get("status") as ContestStatus | null) ?? undefined;
        const supabase = createSupabaseAdminClient();
        const contests = await listContests(supabase, { status, withStages: true });
        return apiSuccess(contests);
    } catch (err) {
        return handleRouteError(err);
    }
}
