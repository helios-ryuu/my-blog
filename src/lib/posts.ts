// Public post helpers used by route segments and homepage cards.
import { createSupabasePublicClient, hasSupabasePublicConfig } from "./supabase/public";
import { getPublishedSeriesPosts as dbGetPublishedSeriesPosts, listPosts, getPostBySlug as dbGetPostBySlug } from "./posts-db";
import { getCategoryBySlug, listCategories } from "./categories-db";
import type { DbCategory, DbPostSummaryWithRelations, DbPostWithRelations } from "@/types/database";
import type { Post, PostMeta } from "@/types/post";

function categoryFields(category?: DbCategory | null) {
    return category ? { categoryName: category.name, categoryIcon: category.icon ?? undefined } : {};
}

function toPost(row: DbPostWithRelations, category?: DbCategory | null): Post {
    const date = row.published_at ?? row.created_at;
    return {
        slug: row.slug,
        title: row.title,
        description: row.description,
        content: row.content,
        image: row.image_url ?? undefined,
        date: new Date(date).toISOString().split("T")[0],
        tags: row.tags.map((t) => t.name),
        category: row.category,
        ...categoryFields(category),
        level: row.level,
        readingTime: row.reading_time,
        type: row.type,
        series: row.series,
        seriesOrder: row.series_order,
    };
}

function toMeta(row: DbPostSummaryWithRelations, categories?: Map<string, DbCategory>): PostMeta {
    const date = row.published_at ?? row.created_at;
    return {
        slug: row.slug,
        title: row.title,
        description: row.description,
        image: row.image_url ?? undefined,
        date: new Date(date).toISOString().split("T")[0],
        tags: row.tags.map((tag) => tag.name),
        category: row.category,
        ...categoryFields(categories?.get(row.category)),
        level: row.level,
        readingTime: row.reading_time,
        type: row.type,
        series: row.series,
        seriesOrder: row.series_order,
    };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
    const supabase = createSupabasePublicClient();
    const row = await dbGetPostBySlug(supabase, slug);
    if (!row) return null;
    return toPost(row, await getCategoryBySlug(supabase, row.category));
}

export async function getAllPostsMeta(): Promise<PostMeta[]> {
    if (!hasSupabasePublicConfig()) return [];
    try {
        const supabase = createSupabasePublicClient();
        const [{ items }, categoryRows] = await Promise.all([
            listPosts(supabase, { pageSize: 50, publishedOnly: true }),
            listCategories(supabase),
        ]);
        const categories = new Map(categoryRows.map((category) => [category.slug, category]));
        return items.map((post) => toMeta(post, categories));
    } catch (error) {
        console.error("Unable to load posts:", error);
        return [];
    }
}

export async function getAllTags(): Promise<string[]> {
    if (!hasSupabasePublicConfig()) return [];
    try {
        const supabase = createSupabasePublicClient();
        const { data } = await supabase.from("tag").select("name").order("name");
        return ((data ?? []) as Array<{ name: string }>).map((t) => t.name);
    } catch (error) {
        console.error("Unable to load tags:", error);
        return [];
    }
}

export async function getRelatedPosts(
    currentSlug: string,
    tags: string[] = [],
    limit = 3,
): Promise<PostMeta[]> {
    if (tags.length === 0) return [];
    const all = await getAllPostsMeta();
    return all
        .filter((p) => p.slug !== currentSlug)
        .map((p) => ({
            p,
            score: (p.tags ?? []).filter((t) => tags.includes(t)).length,
        }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((x) => x.p);
}

export async function getPublishedSeriesPosts(seriesId: number): Promise<PostMeta[]> {
    const supabase = createSupabasePublicClient();
    const [rows, categoryRows] = await Promise.all([
        dbGetPublishedSeriesPosts(supabase, seriesId),
        listCategories(supabase),
    ]);
    const categories = new Map(categoryRows.map((category) => [category.slug, category]));
    return rows.map((post) => toMeta(post, categories));
}
