import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSubmission } from "@/lib/contests-db";
import { createSubmissionSignedUrl } from "@/lib/storage";
import { apiSuccess, apiError, handleRouteError, parseIdParam } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "submission id");
        if (id instanceof NextResponse) return id;
        const supabase = createSupabaseAdminClient();
        const sub = await getSubmission(supabase, id);
        if (!sub) return apiError("submission not found", 404);
        const url = await createSubmissionSignedUrl(supabase, sub.storage_path, 600);
        return apiSuccess({ url });
    } catch (err) {
        return handleRouteError(err);
    }
}
