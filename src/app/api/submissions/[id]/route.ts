import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSubmission, isRegistrationLeader, deleteSubmission } from "@/lib/contests-db";
import { deleteSubmissionFile } from "@/lib/storage";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-helpers";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const current = await requireAuth();
        const { id } = await ctx.params;
        const subId = parseInt(id, 10);
        if (Number.isNaN(subId)) return apiError("invalid id", 400);

        const supabase = createSupabaseAdminClient();
        const sub = await getSubmission(supabase, subId);
        if (!sub) return apiError("submission not found", 404);

        const isLeader = await isRegistrationLeader(supabase, sub.registration_id, current.profile.id);
        if (!isLeader) return apiError("Forbidden", 403);

        await deleteSubmissionFile(supabase, sub.storage_path);
        await deleteSubmission(supabase, subId);
        return apiSuccess({ id: subId });
    } catch (err) {
        return handleRouteError(err);
    }
}
