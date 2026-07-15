// Public post helpers used by route segments and homepage cards.
import { createSupabaseAdminClient } from "./supabase/admin";
import { listPosts, getPostBySlug as dbGetPostBySlug } from "./posts-db";
import type { DbPostWithRelations } from "@/types/database";
import type { Post, PostMeta } from "@/types/post";

function toPost(row: DbPostWithRelations): Post {
    const date = row.published_at ?? row.created_at;
    return {
        slug: row.slug,
        title: row.title,
        description: row.description,
        content: row.content,
        image: row.image_url ?? undefined,
        date: new Date(date).toISOString().split("T")[0],
        tags: row.tags.map((t) => t.name),
        readingTime: "",
        category: row.category,
    };
}

function toMeta(row: DbPostWithRelations): PostMeta {
    const { content: _content, ...rest } = toPost(row);
    void _content;
    return rest;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
    const supabase = createSupabaseAdminClient();
    const row = await dbGetPostBySlug(supabase, slug);
    return row ? toPost(row) : null;
}

export async function getAllPostsMeta(): Promise<PostMeta[]> {
    const supabase = createSupabaseAdminClient();
    const { items } = await listPosts(supabase, { pageSize: 50, publishedOnly: true });
    return items.map(toMeta);
}

export async function getAllTags(): Promise<string[]> {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("tag").select("name").order("name");
    return ((data ?? []) as Array<{ name: string }>).map((t) => t.name);
}

export async function getAllLevels(): Promise<string[]> {
    return [];
}

export async function getPostsByTag(tag: string): Promise<PostMeta[]> {
    const supabase = createSupabaseAdminClient();
    const { items } = await listPosts(supabase, { pageSize: 50, tag, publishedOnly: true });
    return items.map(toMeta);
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
