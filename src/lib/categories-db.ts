import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminCategory } from "@/types/admin";
import type { DbCategory } from "@/types/database";

const CATEGORY_FIELDS = "id, name, slug, icon, description, examples, display_order, created_at, updated_at";

export type CategoryInput = Pick<DbCategory, "name" | "slug" | "icon" | "description" | "examples">;

export async function listCategories(supabase: SupabaseClient): Promise<DbCategory[]> {
    const { data, error } = await supabase
        .from("category")
        .select(CATEGORY_FIELDS)
        .order("display_order")
        .order("id");
    if (error) throw new Error(error.message);
    return (data ?? []) as DbCategory[];
}

export async function listCategoriesWithPostCounts(supabase: SupabaseClient): Promise<AdminCategory[]> {
    const { data, error } = await supabase
        .from("category")
        .select(`${CATEGORY_FIELDS}, post(count)`)
        .order("display_order")
        .order("id");
    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => {
        const { post, ...category } = row as unknown as DbCategory & { post: Array<{ count: number }> };
        return { ...category, post_count: Number(post[0]?.count ?? 0) };
    });
}

export async function getCategoryById(supabase: SupabaseClient, id: number): Promise<DbCategory | null> {
    const { data, error } = await supabase
        .from("category")
        .select(CATEGORY_FIELDS)
        .eq("id", id)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as DbCategory) ?? null;
}

export async function getCategoryBySlug(supabase: SupabaseClient, slug: string): Promise<DbCategory | null> {
    const { data, error } = await supabase
        .from("category")
        .select(CATEGORY_FIELDS)
        .eq("slug", slug)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as DbCategory) ?? null;
}

export async function getCategoryByName(supabase: SupabaseClient, name: string): Promise<DbCategory | null> {
    const { data, error } = await supabase
        .from("category")
        .select(CATEGORY_FIELDS)
        .eq("name", name)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as DbCategory) ?? null;
}

export async function categorySlugExists(supabase: SupabaseClient, slug: string): Promise<boolean> {
    return (await getCategoryBySlug(supabase, slug)) !== null;
}

export async function createCategory(supabase: SupabaseClient, input: CategoryInput): Promise<DbCategory> {
    const { data: orderData, error: orderError } = await supabase
        .from("category")
        .select("display_order")
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();
    if (orderError) throw new Error(orderError.message);

    const { data, error } = await supabase
        .from("category")
        .insert({ ...input, display_order: Number(orderData?.display_order ?? 0) + 1 })
        .select(CATEGORY_FIELDS)
        .single();
    if (error) throw new Error(error.message);
    return data as DbCategory;
}

export async function updateCategory(
    supabase: SupabaseClient,
    id: number,
    patch: Partial<CategoryInput>,
): Promise<DbCategory> {
    const { data, error } = await supabase
        .from("category")
        .update(patch)
        .eq("id", id)
        .select(CATEGORY_FIELDS)
        .single();
    if (error) throw new Error(error.message);
    return data as DbCategory;
}

export async function deleteCategory(supabase: SupabaseClient, id: number): Promise<void> {
    const { error } = await supabase.from("category").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

export async function countCategoryPosts(supabase: SupabaseClient, slug: string): Promise<number> {
    const { count, error } = await supabase
        .from("post")
        .select("id", { count: "exact", head: true })
        .eq("category", slug);
    if (error) throw new Error(error.message);
    return count ?? 0;
}
