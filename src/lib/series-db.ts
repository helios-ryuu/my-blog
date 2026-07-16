import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminSeries } from "@/types/admin";
import type { DbSeries } from "@/types/database";

const SERIES_FIELDS = "id, name, slug, description, created_at, updated_at";

export interface SeriesInput {
    name: string;
    slug: string;
    description?: string | null;
}

export interface SeriesListOptions {
    page?: number;
    pageSize?: number;
    q?: string;
}

export async function listSeriesWithPostCounts(
    supabase: SupabaseClient,
    options: SeriesListOptions = {},
): Promise<{ items: AdminSeries[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 20));
    const from = (page - 1) * pageSize;
    let query = supabase
        .from("series")
        .select(`${SERIES_FIELDS}, post(count)`, { count: "exact" })
        .order("name");

    const q = options.q?.replace(/[%,()\"]/g, " ").trim();
    if (q) {
        const filters = [`name.ilike.%${q}%`, `slug.ilike.%${q}%`];
        if (/^\d+$/.test(q)) filters.push(`id.eq.${q}`);
        query = query.or(filters.join(","));
    }

    const { data, error, count } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const items = (data ?? []).map((row) => {
        const { post, ...series } = row as unknown as DbSeries & { post: Array<{ count: number }> };
        return { ...series, post_count: Number(post[0]?.count ?? 0) };
    });
    return { items, total: count ?? 0, page, pageSize };
}

export async function getSeriesById(supabase: SupabaseClient, id: number): Promise<DbSeries | null> {
    const { data, error } = await supabase.from("series").select(SERIES_FIELDS).eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as DbSeries) ?? null;
}

export async function getSeriesBySlug(supabase: SupabaseClient, slug: string): Promise<DbSeries | null> {
    const { data, error } = await supabase.from("series").select(SERIES_FIELDS).eq("slug", slug).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as DbSeries) ?? null;
}

export async function getSeriesByName(supabase: SupabaseClient, name: string): Promise<DbSeries | null> {
    const { data, error } = await supabase.from("series").select(SERIES_FIELDS).eq("name", name).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as DbSeries) ?? null;
}

export async function createSeries(supabase: SupabaseClient, input: SeriesInput): Promise<DbSeries> {
    const { data, error } = await supabase
        .from("series")
        .insert({ ...input, description: input.description || null })
        .select(SERIES_FIELDS)
        .single();
    if (error) throw new Error(error.message);
    return data as DbSeries;
}

export async function updateSeries(
    supabase: SupabaseClient,
    id: number,
    patch: Partial<SeriesInput>,
): Promise<DbSeries> {
    const { data, error } = await supabase
        .from("series")
        .update(patch)
        .eq("id", id)
        .select(SERIES_FIELDS)
        .single();
    if (error) throw new Error(error.message);
    return data as DbSeries;
}

export async function deleteSeries(supabase: SupabaseClient, id: number): Promise<void> {
    const { error } = await supabase.from("series").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

export async function countSeriesPosts(supabase: SupabaseClient, id: number): Promise<number> {
    const { count, error } = await supabase
        .from("post")
        .select("id", { count: "exact", head: true })
        .eq("series_id", id);
    if (error) throw new Error(error.message);
    return count ?? 0;
}

export async function isSeriesOrderAvailable(
    supabase: SupabaseClient,
    seriesId: number,
    order: number,
    excludePostId?: number,
): Promise<boolean> {
    let query = supabase
        .from("post")
        .select("id", { count: "exact", head: true })
        .eq("series_id", seriesId)
        .eq("series_order", order);
    if (excludePostId) query = query.neq("id", excludePostId);
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return (count ?? 0) === 0;
}
