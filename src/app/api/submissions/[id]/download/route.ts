import { NextRequest } from "next/server";
import { requireAuth, getCurrentUser } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSubmission, isRegistrationMember } from "@/lib/contests-db";
import { createSubmissionSignedUrl } from "@/lib/storage";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAuth();
        const current = await getCurrentUser();
        if (!current) return apiError("Unauthorized", 401);

        const { id } = await ctx.params;
        const subId = parseInt(id, 10);
        if (Number.isNaN(subId)) return apiError("invalid id", 400);

        const supabase = createSupabaseAdminClient();
        const sub = await getSubmission(supabase, subId);
        if (!sub) return apiError("submission not found", 404);

        const isAdmin = current.profile.role === "admin";
        if (!isAdmin) {
            const member = await isRegistrationMember(supabase, sub.registration_id, current.profile.id);
            if (!member) {
                // also allow pending members read access
                const { data } = await supabase
                    .from("registration_member")
                    .select("user_id")
                    .eq("registration_id", sub.registration_id)
                    .eq("user_id", current.profile.id)
                    .maybeSingle();
                if (!data) return apiError("Forbidden", 403);
            }
        }

        const url = await createSubmissionSignedUrl(supabase, sub.storage_path, 300);
        return apiSuccess({ url, expires_in: 300 });
    } catch (err) {
        return handleRouteError(err);
    }
}
