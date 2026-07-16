import type { SupabaseClient } from "@supabase/supabase-js";
import {
    type DbPost,
    type DbPostSummary,
    type DbPostSummaryWithRelations,
    type DbPostWithRelations,
    type DbSeries,
    type DbTag,
    type PostCategory,
    type PostLevel,
    type PostType,
} from "@/types/database";

const POST_FIELDS = "id, slug, title, description, content, image_url, category, level, reading_time, series_id, series_order, published, published_at, created_at, updated_at";
const POST_SUMMARY_FIELDS = "id, slug, title, description, image_url, category, level, reading_time, series_id, series_order, published, published_at, created_at, updated_at";

export interface ListOptions {
    page?: number;
    pageSize?: number;
    tag?: string;
    category?: PostCategory;
    level?: PostLevel;
    q?: string;
    publishedOnly?: boolean;
    published?: boolean;
    type?: PostType;
    seriesId?: number;
}

async function attachTags<T extends DbPost | DbPostSummary>(
    supabase: SupabaseClient,
    posts: T[],
): Promise<Array<T & { tags: DbTag[] }>> {
    if (posts.length === 0) return [];
    const ids = posts.map((p) => p.id);
    const { data, error } = await supabase
        .from("post_tags")
        .select("post_id, tag:tag(id, name, slug, created_at)")
        .in("post_id", ids);
    if (error) throw new Error(error.message);

    const byPost = new Map<number, DbTag[]>();
    for (const row of (data ?? []) as unknown as Array<{ post_id: number; tag: DbTag | DbTag[] | null }>) {
        if (!row.tag) continue;
        const tags = Array.isArray(row.tag) ? row.tag : [row.tag];
        const arr = byPost.get(row.post_id) ?? [];
        arr.push(...tags);
        byPost.set(row.post_id, arr);
    }
    return posts.map((p) => ({ ...p, tags: byPost.get(p.id) ?? [] }));
}

async function attachRelations<T extends DbPost | DbPostSummary>(
    supabase: SupabaseClient,
    posts: T[],
): Promise<Array<T & { tags: DbTag[]; series: DbSeries | null; type: PostType }>> {
    if (posts.length === 0) return [];
    const withTags = await attachTags(supabase, posts);
    const seriesIds = [...new Set(posts.flatMap((post) => post.series_id ? [post.series_id] : []))];
    const byId = new Map<number, DbSeries>();
    if (seriesIds.length > 0) {
        const { data, error } = await supabase
            .from("series")
            .select("id, name, slug, description, created_at, updated_at")
            .in("id", seriesIds);
        if (error) throw new Error(error.message);
        for (const series of (data ?? []) as DbSeries[]) byId.set(series.id, series);
    }
    return withTags.map((post) => ({
        ...post,
        series: post.series_id ? byId.get(post.series_id) ?? null : null,
        type: post.series_id ? "series" : "standalone",
    }));
}

export async function listPosts(
    supabase: SupabaseClient,
    opts: ListOptions = {},
): Promise<{ items: DbPostSummaryWithRelations[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 10));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from("post")
        .select(POST_SUMMARY_FIELDS, { count: "exact" })
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

    if (opts.publishedOnly !== false) query = query.eq("published", true);
    else if (opts.published !== undefined) query = query.eq("published", opts.published);
    if (opts.category) query = query.eq("category", opts.category);
    if (opts.level) query = query.eq("level", opts.level);
    if (opts.type === "standalone") query = query.is("series_id", null);
    if (opts.type === "series") query = query.not("series_id", "is", null);
    if (opts.seriesId) query = query.eq("series_id", opts.seriesId);
    if (opts.q) {
        const escaped = opts.q.replace(/[%,()\"]/g, " ").trim();
        if (escaped) {
            const filters = [
                `title.ilike.%${escaped}%`,
                `slug.ilike.%${escaped}%`,
                `description.ilike.%${escaped}%`,
            ];
            if (/^\d+$/.test(escaped)) filters.push(`id.eq.${escaped}`);
            query = query.or(filters.join(","));
        }
    }

    if (opts.tag) {
        const { data: tagRow } = await supabase.from("tag").select("id").eq("slug", opts.tag).single();
        const row = tagRow as { id: number } | null;
        if (!row) return { items: [], total: 0, page, pageSize };
        const { data: rels } = await supabase.from("post_tags").select("post_id").eq("tag_id", row.id);
        const ids = ((rels ?? []) as Array<{ post_id: number }>).map((r) => r.post_id);
        if (ids.length === 0) return { items: [], total: 0, page, pageSize };
        query = query.in("id", ids);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw new Error(error.message);

    const items = await attachRelations(supabase, (data ?? []) as DbPostSummary[]);
    return { items, total: count ?? 0, page, pageSize };
}

export async function getPostBySlug(
    supabase: SupabaseClient,
    slug: string,
    includeUnpublished = false,
): Promise<DbPostWithRelations | null> {
    let query = supabase.from("post").select(POST_FIELDS).eq("slug", slug).limit(1);
    if (!includeUnpublished) query = query.eq("published", true);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const [withRelations] = await attachRelations(supabase, [data as DbPost]);
    return withRelations;
}

export async function getPostById(
    supabase: SupabaseClient,
    id: number,
): Promise<DbPostWithRelations | null> {
    const { data, error } = await supabase.from("post").select(POST_FIELDS).eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const [withRelations] = await attachRelations(supabase, [data as DbPost]);
    return withRelations;
}

export async function getPublishedSeriesPosts(
    supabase: SupabaseClient,
    seriesId: number,
): Promise<DbPostSummaryWithRelations[]> {
    const { data, error } = await supabase
        .from("post")
        .select(POST_SUMMARY_FIELDS)
        .eq("published", true)
        .eq("series_id", seriesId)
        .order("series_order")
        .limit(500);
    if (error) throw new Error(error.message);
    return attachRelations(supabase, (data ?? []) as DbPostSummary[]);
}

export interface PostInput {
    slug: string;
    title: string;
    description: string;
    content: string;
    image_url?: string | null;
    category?: PostCategory;
    level?: PostLevel;
    reading_time?: number;
    series_id?: number | null;
    series_order?: number | null;
    published?: boolean;
    tag_ids?: number[];
}

export async function createPost(
    supabase: SupabaseClient,
    input: PostInput,
): Promise<DbPost> {
    const published = input.published ?? false;
    const insert = {
        slug: input.slug,
        title: input.title,
        description: input.description,
        content: input.content,
        image_url: input.image_url ?? null,
        category: input.category ?? "articles",
        level: input.level ?? "beginner",
        reading_time: input.reading_time ?? 5,
        series_id: input.series_id ?? null,
        series_order: input.series_order ?? null,
        published,
        published_at: published ? new Date().toISOString() : null,
    };
    const { data, error } = await supabase.from("post").insert(insert).select(POST_FIELDS).single();
    if (error) throw new Error(error.message);
    const post = data as DbPost;
    if (input.tag_ids?.length) {
        await replacePostTags(supabase, post.id, input.tag_ids);
    }
    return post;
}

export async function updatePost(
    supabase: SupabaseClient,
    id: number,
    patch: Partial<PostInput>,
): Promise<DbPost> {
    const { tag_ids, ...rest } = patch;
    const update: Record<string, unknown> = { ...rest };
    if (rest.published === true) {
        const existing = await getPostById(supabase, id);
        if (existing && !existing.published_at) update.published_at = new Date().toISOString();
    } else if (rest.published === false) {
        update.published_at = null;
    }
    const { data, error } = await supabase.from("post").update(update).eq("id", id).select(POST_FIELDS).single();
    if (error) throw new Error(error.message);
    if (tag_ids) await replacePostTags(supabase, id, tag_ids);
    return data as DbPost;
}

export async function deletePost(
    supabase: SupabaseClient,
    id: number,
): Promise<void> {
    const { error } = await supabase.from("post").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

export async function setPostPublished(
    supabase: SupabaseClient,
    id: number,
    published: boolean,
): Promise<DbPost> {
    return updatePost(supabase, id, { published });
}

async function replacePostTags(
    supabase: SupabaseClient,
    postId: number,
    tagIds: number[],
): Promise<void> {
    const { error: delErr } = await supabase.from("post_tags").delete().eq("post_id", postId);
    if (delErr) throw new Error(delErr.message);
    if (tagIds.length === 0) return;
    const rows = tagIds.map((tag_id) => ({ post_id: postId, tag_id }));
    const { error } = await supabase.from("post_tags").insert(rows);
    if (error) throw new Error(error.message);
}
