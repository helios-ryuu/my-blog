import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbTag } from "@/types/database";

export async function listTags(supabase: SupabaseClient): Promise<DbTag[]> {
    const { data, error } = await supabase.from("tag").select("*").order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as DbTag[];
}

export async function getTagById(
    supabase: SupabaseClient,
    id: number,
): Promise<DbTag | null> {
    const { data, error } = await supabase.from("tag").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as DbTag) ?? null;
}

export async function createTag(
    supabase: SupabaseClient,
    input: { name: string; slug: string },
): Promise<DbTag> {
    const { data, error } = await supabase.from("tag").insert(input).select("*").single();
    if (error) throw new Error(error.message);
    return data as DbTag;
}

export async function updateTag(
    supabase: SupabaseClient,
    id: number,
    patch: Partial<Pick<DbTag, "name" | "slug">>,
): Promise<DbTag> {
    const { data, error } = await supabase.from("tag").update(patch).eq("id", id).select("*").single();
    if (error) throw new Error(error.message);
    return data as DbTag;
}

export async function deleteTag(supabase: SupabaseClient, id: number): Promise<void> {
    const { error } = await supabase.from("tag").delete().eq("id", id);
    if (error) throw new Error(error.message);
}
