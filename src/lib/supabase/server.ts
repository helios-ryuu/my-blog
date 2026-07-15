import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbUser } from "@/types/database";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
    return createSupabaseAdminClient();
}

export async function getCurrentUser(): Promise<{ profile: DbUser } | null> {
    const cookieStore = await cookies();
    const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
    if (!session) return null;

    const supabase = createSupabaseAdminClient();
    const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.userId)
        .maybeSingle();

    return profile ? { profile: profile as DbUser } : null;
}

export async function requireAuth() {
    const current = await getCurrentUser();
    if (!current) throw new Error("UNAUTHORIZED");
    return current;
}

export async function requireAdmin() {
    const current = await requireAuth();
    if (current.profile.role !== "admin") throw new Error("FORBIDDEN");
    return current;
}
