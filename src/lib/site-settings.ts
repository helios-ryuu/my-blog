import { unstable_cache, revalidateTag } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabasePublicClient, hasSupabasePublicConfig } from "@/lib/supabase/public";
import { ACCENT_COLOR_PATTERN, DEFAULT_ACCENT_COLOR } from "@/config/site";
import { HttpError } from "@/lib/api-helpers";

function normalizeAccentColor(value: unknown): string {
    return typeof value === "string" && ACCENT_COLOR_PATTERN.test(value)
        ? value.toLowerCase()
        : DEFAULT_ACCENT_COLOR;
}

const getCachedAccentColor = unstable_cache(
    async () => {
        if (!hasSupabasePublicConfig()) {
            return DEFAULT_ACCENT_COLOR;
        }
        try {
            const supabase = createSupabasePublicClient();
            const { data, error } = await supabase
                .from("site_settings")
                .select("value")
                .eq("key", "accent_color")
                .maybeSingle();
            if (error) throw new Error(error.message);
            return normalizeAccentColor((data as { value?: unknown } | null)?.value);
        } catch (error) {
            console.error("Unable to load accent color:", error);
            return DEFAULT_ACCENT_COLOR;
        }
    },
    ["site-accent-color"],
    { revalidate: 3600, tags: ["site-settings"] },
);

export async function getAccentColor(): Promise<string> {
    return getCachedAccentColor();
}

export async function updateAccentColor(value: unknown): Promise<string> {
    if (typeof value !== "string" || !ACCENT_COLOR_PATTERN.test(value)) {
        throw new HttpError(400, "Accent color must be a six-digit hex color");
    }
    const accentColor = value.toLowerCase();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("site_settings").upsert({
        key: "accent_color",
        value: accentColor,
        is_public: true,
        updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    revalidateTag("site-settings", "max");
    return accentColor;
}
