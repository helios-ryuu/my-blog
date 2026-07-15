import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { uploadPostImage } from "@/lib/storage";
import { apiSuccess, handleRouteError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
        const form = await req.formData();
        const file = form.get("file");
        if (!(file instanceof File)) return handleRouteError(new Error("file required"));
        const supabase = createSupabaseAdminClient();
        const result = await uploadPostImage(supabase, file);
        return apiSuccess(result);
    } catch (err) {
        return handleRouteError(err);
    }
}
