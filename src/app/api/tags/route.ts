import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listTags } from "@/lib/tags-db";
import { apiSuccess, handleRouteError } from "@/lib/api-helpers";

export async function GET() {
    try {
        const supabase = createSupabaseAdminClient();
        const tags = await listTags(supabase);
        return apiSuccess(tags);
    } catch (err) {
        return handleRouteError(err);
    }
}
