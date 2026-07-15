import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateTag, deleteTag } from "@/lib/tags-db";
import { apiSuccess, handleRouteError, parseIdParam, revalidateTags } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "tag id");
        if (id instanceof NextResponse) return id;
        const body = await req.json();
        const supabase = createSupabaseAdminClient();
        const tag = await updateTag(supabase, id, body);
        revalidateTags();
        return apiSuccess(tag);
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "tag id");
        if (id instanceof NextResponse) return id;
        const supabase = createSupabaseAdminClient();
        await deleteTag(supabase, id);
        revalidateTags();
        return apiSuccess({ id });
    } catch (err) {
        return handleRouteError(err);
    }
}
