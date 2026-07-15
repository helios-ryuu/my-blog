import { getCurrentUser } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api-helpers";
import { dbUserToUser } from "@/lib/users-db";

export async function GET() {
    const current = await getCurrentUser();
    if (!current) {
        return apiError("Unauthorized", 401);
    }
    return apiSuccess(dbUserToUser(current.profile));
}
