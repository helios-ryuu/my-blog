import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbUser } from "@/types/database";
import type { User } from "@/types/user";

export function dbUserToUser(row: DbUser): User {
    return {
        id: row.id,
        username: row.username,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        school: row.school,
        role: row.role,
        created_at: row.created_at,
    };
}

export async function getUserById(
    supabase: SupabaseClient,
    id: string,
): Promise<DbUser | null> {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
    if (error) return null;
    return (data as DbUser) ?? null;
}

export async function getUsersByIds(
    supabase: SupabaseClient,
    ids: string[],
): Promise<DbUser[]> {
    if (ids.length === 0) return [];
    const { data, error } = await supabase.from("users").select("*").in("id", ids);
    if (error) throw new Error(error.message);
    return (data ?? []) as DbUser[];
}

export async function getUsersByUsernames(
    supabase: SupabaseClient,
    usernames: string[],
): Promise<DbUser[]> {
    if (usernames.length === 0) return [];
    const { data, error } = await supabase.from("users").select("*").in("username", usernames);
    if (error) throw new Error(error.message);
    return (data ?? []) as DbUser[];
}

export async function getUserByCredentials(
    supabase: SupabaseClient,
    username: string,
    password: string,
): Promise<DbUser | null> {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as DbUser) ?? null;
}

export interface UserAdminInput {
    username: string;
    password: string;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    school?: string | null;
    role?: DbUser["role"];
}

export async function listUsers(supabase: SupabaseClient): Promise<DbUser[]> {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as DbUser[];
}

export async function createUser(supabase: SupabaseClient, input: UserAdminInput): Promise<DbUser> {
    const { data, error } = await supabase
        .from("users")
        .insert({
            id: crypto.randomUUID(),
            username: input.username,
            password: input.password,
            full_name: input.full_name,
            email: input.email ?? null,
            phone: input.phone ?? null,
            school: input.school ?? null,
            role: input.role ?? "user",
        })
        .select("*")
        .single();
    if (error) throw new Error(error.message);
    return data as DbUser;
}

export async function updateUserAdmin(
    supabase: SupabaseClient,
    id: string,
    patch: Partial<UserAdminInput>,
): Promise<DbUser> {
    const { data, error } = await supabase
        .from("users")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
    if (error) throw new Error(error.message);
    return data as DbUser;
}

export async function deleteUser(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

export async function updateUserProfile(
    supabase: SupabaseClient,
    id: string,
    patch: Partial<Pick<DbUser, "full_name" | "email" | "phone" | "school">>,
): Promise<DbUser> {
    const { data, error } = await supabase
        .from("users")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
    if (error) throw new Error(error.message);
    return data as DbUser;
}
