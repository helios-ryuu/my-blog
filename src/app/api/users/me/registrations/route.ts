import { requireAuth } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, handleRouteError } from "@/lib/api-helpers";

export async function GET() {
    try {
        const current = await requireAuth();
        const supabase = createSupabaseAdminClient();

        const { data: memberRows, error } = await supabase
            .from("registration_member")
            .select("registration_id")
            .eq("user_id", current.profile.id);

        if (error) throw new Error(error.message);

        const regIds = memberRows?.map(r => r.registration_id) || [];
        if (regIds.length === 0) {
            return apiSuccess([]);
        }

        const { data, error: errReg } = await supabase
            .from("contest_registration")
            .select("*, contest(*, contest_stage(*)), registration_member(*, users(username, full_name)), submission(*)")
            .in("id", regIds)
            .order("registered_at", { ascending: false });

        if (errReg) throw new Error(errReg.message);
        
        return apiSuccess(data || []);
    } catch (err) {
        return handleRouteError(err);
    }
}
