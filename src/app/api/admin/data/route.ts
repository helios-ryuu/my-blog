import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-helpers";

const ALLOWED_TABLES = ["post", "category", "series", "tag", "post_tags", "site_settings"] as const;

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
        const [postRes, categoryRes, seriesRes, tagRes, postTagsRes, settingsRes] = await Promise.all([
            supabase.from("post").select("id, slug, title, category, level, reading_time, series_id, series_order, published, published_at, created_at, updated_at").order("id", { ascending: false }).limit(500),
            supabase.from("category").select("*").order("display_order").limit(500),
            supabase.from("series").select("*").order("name").limit(500),
            supabase.from("tag").select("*").order("id", { ascending: false }).limit(500),
            supabase.from("post_tags").select("post_id, tag_id").limit(2000),
            supabase.from("site_settings").select("key, value, is_public, updated_at").order("key").limit(100),
        ]);

        for (const r of [postRes, categoryRes, seriesRes, tagRes, postTagsRes, settingsRes]) {
            if (r.error) return apiError(r.error.message, 500);
        }

        return apiSuccess({
            post: postRes.data ?? [],
            category: categoryRes.data ?? [],
            series: seriesRes.data ?? [],
            tag: tagRes.data ?? [],
            post_tags: postTagsRes.data ?? [],
            site_settings: settingsRes.data ?? [],
        });
    } catch (err) {
        return handleRouteError(err);
    }
}
