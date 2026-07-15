import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listTags, createTag } from "@/lib/tags-db";
import { apiSuccess, handleRouteError, revalidateTags } from "@/lib/api-helpers";

export async function GET() {
    try {
        await requireAdmin();
        const supabase = createSupabaseAdminClient();
        const tags = await listTags(supabase);
        return apiSuccess(tags);
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
        const body = await req.json();
        if (!body.name || !body.slug) return handleRouteError(new Error("name and slug required"));
        const supabase = createSupabaseAdminClient();
        const tag = await createTag(supabase, { name: body.name, slug: body.slug });
        revalidateTags();
        return apiSuccess(tag);
    } catch (err) {
        return handleRouteError(err);
    }
}
