import { NextRequest, NextResponse } from "next/server";
import {
    apiError,
    apiSuccess,
    handleRouteError,
    HttpError,
    parseIdParam,
    revalidateSeries,
} from "@/lib/api-helpers";
import { parseSeriesPatchInput } from "@/lib/content-validation";
import {
    countSeriesPosts,
    deleteSeries,
    getSeriesById,
    getSeriesByName,
    getSeriesBySlug,
    updateSeries,
} from "@/lib/series-db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(context.params, "series id");
        if (id instanceof NextResponse) return id;
        const series = await getSeriesById(createSupabaseAdminClient(), id);
        return series ? apiSuccess(series) : apiError("Series not found", 404);
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(context.params, "series id");
        if (id instanceof NextResponse) return id;
        const input = parseSeriesPatchInput(await request.json().catch(() => null));
        const supabase = createSupabaseAdminClient();
        const current = await getSeriesById(supabase, id);
        if (!current) return apiError("Series not found", 404);
        if (input.slug && input.slug !== current.slug && await getSeriesBySlug(supabase, input.slug)) {
            throw new HttpError(409, "Series slug already exists");
        }
        if (input.name && input.name !== current.name && await getSeriesByName(supabase, input.name)) {
            throw new HttpError(409, "Series name already exists");
        }
        const series = await updateSeries(supabase, id, input);
        revalidateSeries();
        return apiSuccess(series);
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(context.params, "series id");
        if (id instanceof NextResponse) return id;
        const supabase = createSupabaseAdminClient();
        if (!await getSeriesById(supabase, id)) return apiError("Series not found", 404);
        const postCount = await countSeriesPosts(supabase, id);
        if (postCount > 0) throw new HttpError(409, `Series is used by ${postCount} post(s)`);
        await deleteSeries(supabase, id);
        revalidateSeries();
        return apiSuccess({ id });
    } catch (error) {
        return handleRouteError(error);
    }
}
