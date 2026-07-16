import { NextRequest } from "next/server";
import { apiSuccess, handleRouteError, HttpError, revalidateSeries } from "@/lib/api-helpers";
import { parseSeriesCreateInput } from "@/lib/content-validation";
import {
    createSeries,
    getSeriesByName,
    getSeriesBySlug,
    listSeriesWithPostCounts,
} from "@/lib/series-db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        await requireAdmin();
        const page = Number(request.nextUrl.searchParams.get("page") ?? 1);
        const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? 20);
        const q = request.nextUrl.searchParams.get("q")?.trim() || undefined;
        if (q && q.length > 100) throw new HttpError(400, "Search query is too long");
        return apiSuccess(await listSeriesWithPostCounts(createSupabaseAdminClient(), { page, pageSize, q }));
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const input = parseSeriesCreateInput(await request.json().catch(() => null));
        const supabase = createSupabaseAdminClient();
        if (await getSeriesBySlug(supabase, input.slug)) throw new HttpError(409, "Series slug already exists");
        if (await getSeriesByName(supabase, input.name)) throw new HttpError(409, "Series name already exists");
        const series = await createSeries(supabase, input);
        revalidateSeries();
        return apiSuccess(series);
    } catch (error) {
        return handleRouteError(error);
    }
}
