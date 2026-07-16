import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateTag, deleteTag, getTagById } from "@/lib/tags-db";
import { apiSuccess, apiError, handleRouteError, parseIdParam, revalidateTags } from "@/lib/api-helpers";
import { parseTagPatchInput } from "@/lib/content-validation";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(ctx.params, "tag id");
        if (id instanceof NextResponse) return id;
        const body = parseTagPatchInput(await req.json().catch(() => null));
        const supabase = createSupabaseAdminClient();
        if (!await getTagById(supabase, id)) return apiError("Tag not found", 404);
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
        if (!await getTagById(supabase, id)) return apiError("Tag not found", 404);
        await deleteTag(supabase, id);
        revalidateTags();
        return apiSuccess({ id });
    } catch (err) {
        return handleRouteError(err);
    }
}
