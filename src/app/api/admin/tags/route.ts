import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listTags, createTag } from "@/lib/tags-db";
import { apiSuccess, handleRouteError, revalidateTags } from "@/lib/api-helpers";
import { parseTagCreateInput } from "@/lib/content-validation";

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
        const body = parseTagCreateInput(await req.json().catch(() => null));
        const supabase = createSupabaseAdminClient();
        const tag = await createTag(supabase, { name: body.name, slug: body.slug });
        revalidateTags();
        return apiSuccess(tag);
    } catch (err) {
        return handleRouteError(err);
    }
}
