import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function hasSupabasePublicConfig(): boolean {
    return Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
        && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
    );
}

export function createSupabasePublicClient(): SupabaseClient {
    if (cached) return cached;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
    if (!url || !key) throw new Error("Supabase public URL and publishable key are required");

    cached = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    return cached;
}
