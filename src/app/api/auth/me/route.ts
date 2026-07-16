import { getCurrentUser } from "@/lib/supabase/server";
import { apiSuccess } from "@/lib/api-helpers";

export async function GET() {
    const current = await getCurrentUser();
    if (!current) {
        return apiSuccess(null);
    }
    return apiSuccess(current);
}
