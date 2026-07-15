import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createAdminRegistration, listRegistrationsForContest, getRegistrationMembers } from "@/lib/contests-db";
import { apiError, apiSuccess, handleRouteError, parseIdParam } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "contest id");
        if (id instanceof NextResponse) return id;
        const supabase = createSupabaseAdminClient();
        const regs = await listRegistrationsForContest(supabase, id);
        const enriched = await Promise.all(
            regs.map(async (r) => ({ ...r, members: await getRegistrationMembers(supabase, r.id) })),
        );
        return apiSuccess(enriched);
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "contest id");
        if (id instanceof NextResponse) return id;
        const body = await req.json().catch(() => ({}));
        const team_code = typeof body.team_code === "string" ? body.team_code.trim() : "";
        const leader_id = typeof body.leader_id === "string" ? body.leader_id : "";
        const member_ids = Array.isArray(body.member_ids) ? body.member_ids.filter((v: unknown) => typeof v === "string") : [];
        if (!team_code || !leader_id) return apiError("team_code and leader_id are required", 400);
        const supabase = createSupabaseAdminClient();
        const created = await createAdminRegistration(supabase, id, {
            team_code,
            leader_id,
            member_ids,
            team_name: typeof body.team_name === "string" && body.team_name.trim() ? body.team_name.trim() : null,
            level: typeof body.level === "string" && body.level.trim() ? body.level.trim() : null,
        });
        return apiSuccess(created);
    } catch (err) {
        return handleRouteError(err);
    }
}
