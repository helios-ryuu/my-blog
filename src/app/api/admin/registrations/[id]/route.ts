import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deleteRegistration, updateAdminRegistration } from "@/lib/contests-db";
import { apiSuccess, handleRouteError, parseIdParam, revalidateContests } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "registration id");
        if (id instanceof NextResponse) return id;
        const body = await req.json().catch(() => ({}));
        const supabase = createSupabaseAdminClient();
        const memberIds = Array.isArray(body.member_ids) ? body.member_ids.filter((v: unknown) => typeof v === "string") : undefined;
        const updated = await updateAdminRegistration(supabase, id, {
            team_code: typeof body.team_code === "string" ? body.team_code.trim() : undefined,
            team_name: typeof body.team_name === "string" && body.team_name.trim() ? body.team_name.trim() : null,
            level: typeof body.level === "string" && body.level.trim() ? body.level.trim() : null,
            leader_id: typeof body.leader_id === "string" ? body.leader_id : undefined,
            member_ids: memberIds,
        });
        revalidateContests();
        return apiSuccess(updated);
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "registration id");
        if (id instanceof NextResponse) return id;
        const supabase = createSupabaseAdminClient();
        await deleteRegistration(supabase, id);
        revalidateContests();
        return apiSuccess({ id });
    } catch (err) {
        return handleRouteError(err);
    }
}
