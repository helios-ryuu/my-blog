import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-helpers";

const ALLOWED_TABLES = ["users", "post", "tag", "post_tags"] as const;

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
        const { searchParams } = new URL(req.url);
        const table = searchParams.get("table");

        const supabase = createSupabaseAdminClient();

        if (table) {
            if (!(ALLOWED_TABLES as readonly string[]).includes(table)) {
                return apiError("Invalid table", 400);
            }
            const { data, error } = await supabase
                .from(table)
                .select("*")
                .limit(500);
            if (error) return apiError(error.message, 500);
            return apiSuccess({ table, rows: data ?? [] });
        }

        // Fetch all tables in parallel.
        const [usersRes, postRes, tagRes, postTagsRes] = await Promise.all([
            supabase.from("users").select("id, username, full_name, email, phone, role, school, created_at").order("created_at", { ascending: false }).limit(500),
            supabase.from("post").select("id, slug, title, category, published, published_at, created_at, updated_at").order("id", { ascending: false }).limit(500),
            supabase.from("tag").select("*").order("id", { ascending: false }).limit(500),
            supabase.from("post_tags").select("post_id, tag_id").limit(2000),
        ]);

        for (const r of [usersRes, postRes, tagRes, postTagsRes]) {
            if (r.error) return apiError(r.error.message, 500);
        }

        return apiSuccess({
            users: usersRes.data ?? [],
            post: postRes.data ?? [],
            tag: tagRes.data ?? [],
            post_tags: postTagsRes.data ?? [],
        });
    } catch (err) {
        return handleRouteError(err);
    }
}
