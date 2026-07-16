import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "@/lib/api-helpers";
import { getSeriesById, isSeriesOrderAvailable } from "@/lib/series-db";

export async function validateSeriesAssignment(
    supabase: SupabaseClient,
    seriesId: number | null,
    seriesOrder: number | null,
    excludePostId?: number,
): Promise<void> {
    if ((seriesId === null) !== (seriesOrder === null)) {
        throw new HttpError(400, "series_id and series_order must both be set or both be null");
    }
    if (seriesId === null || seriesOrder === null) return;
    if (!await getSeriesById(supabase, seriesId)) throw new HttpError(400, "Series does not exist");
    if (!await isSeriesOrderAvailable(supabase, seriesId, seriesOrder, excludePostId)) {
        throw new HttpError(409, `Series order ${seriesOrder} is already in use`);
    }
}
