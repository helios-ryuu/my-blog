import { createSupabasePublicClient } from "@/lib/supabase/public";
import { listTags } from "@/lib/tags-db";
import { apiSuccess, handleRouteError } from "@/lib/api-helpers";

export async function GET() {
    try {
        const supabase = createSupabasePublicClient();
        const tags = await listTags(supabase);
        return apiSuccess(tags);
    } catch (err) {
        return handleRouteError(err);
    }
}
