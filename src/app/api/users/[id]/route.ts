import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-helpers";
import { getUserById, dbUserToUser } from "@/lib/users-db";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await ctx.params;
        const supabase = await createSupabaseServerClient();
        const row = await getUserById(supabase, id);
        if (!row) return apiError("User not found", 404);
        return apiSuccess(dbUserToUser(row));
    } catch (err) {
        return handleRouteError(err);
    }
}
