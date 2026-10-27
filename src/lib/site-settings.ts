import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabasePublicClient, hasSupabasePublicConfig } from "@/lib/supabase/public";
import { ACCENT_COLOR_PATTERN, DEFAULT_ACCENT_COLOR, BannerConfig, DEFAULT_BANNER_CONFIG } from "@/config/site";
import { DEFAULT_DOCS_CONFIG, type DocsConfig, type DocItem } from "@/data/docs-content";
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

const getCachedBannerConfig = unstable_cache(
    async (): Promise<BannerConfig> => {
        if (!hasSupabasePublicConfig()) return DEFAULT_BANNER_CONFIG;
        try {
            const supabase = createSupabasePublicClient();
            const { data, error } = await supabase
                .from("site_settings")
                .select("value")
                .eq("key", "banner_config")
                .maybeSingle();
            if (error) throw new Error(error.message);
            if (data?.value) {
                try {
                    const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
                    return { ...DEFAULT_BANNER_CONFIG, ...parsed };
                } catch {
                    return DEFAULT_BANNER_CONFIG;
                }
            }
            return DEFAULT_BANNER_CONFIG;
        } catch (error) {
            console.error("Unable to load banner config:", error);
            return DEFAULT_BANNER_CONFIG;
        }
    },
    ["site-banner-config"],
    { revalidate: 3600, tags: ["site-settings"] },
);

export async function getBannerConfig(): Promise<BannerConfig> {
    return getCachedBannerConfig();
}

export async function updateBannerConfig(value: Partial<BannerConfig>): Promise<BannerConfig> {
    const supabase = createSupabaseAdminClient();
    const currentConfig = await getBannerConfig();
    const newConfig = { ...currentConfig, ...value };
    
    const { error } = await supabase.from("site_settings").upsert({
        key: "banner_config",
        value: JSON.stringify(newConfig),
        is_public: true,
        updated_at: new Date().toISOString(),
    });
    
    if (error) throw new Error(error.message);
    revalidateTag("site-settings", "max");
    return newConfig;
}

function normalizeDocsConfig(raw: unknown): DocsConfig {
    if (!raw) return DEFAULT_DOCS_CONFIG;
    try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown }).items)) {
            const validItems = (parsed as { items: unknown[] }).items
                .filter((item): item is DocItem => Boolean(
                    item &&
                    typeof item === "object" &&
                    typeof (item as DocItem).slug === "string" &&
                    typeof (item as DocItem).title === "string" &&
                    typeof (item as DocItem).content === "string",
                ))
                .map((item) => ({
                    id: item.id || item.slug,
                    slug: item.slug.trim(),
                    title: item.title.trim(),
                    description: typeof item.description === "string" ? item.description.trim() : "",
                    content: item.content,
                    updatedAt: item.updatedAt || new Date().toISOString(),
                }));
            if (validItems.length > 0) {
                return { items: validItems };
            }
        }
    } catch {
        // Fallback to default docs config
    }
    return DEFAULT_DOCS_CONFIG;
}

const getCachedDocsConfig = unstable_cache(
    async (): Promise<DocsConfig> => {
        if (!hasSupabasePublicConfig()) return DEFAULT_DOCS_CONFIG;
        try {
            const supabase = createSupabasePublicClient();
            const { data, error } = await supabase
                .from("site_settings")
                .select("value")
                .eq("key", "docs_config")
                .maybeSingle();
            if (error) throw new Error(error.message);
            if (data?.value) {
                return normalizeDocsConfig(data.value);
            }
            return DEFAULT_DOCS_CONFIG;
        } catch (error) {
            console.error("Unable to load docs config:", error);
            return DEFAULT_DOCS_CONFIG;
        }
    },
    ["site-docs-config"],
    { revalidate: 3600, tags: ["site-settings", "site-docs"] },
);

export async function getDocsConfig(): Promise<DocsConfig> {
    return getCachedDocsConfig();
}

export async function updateDocsConfig(input: unknown): Promise<DocsConfig> {
    if (!input || typeof input !== "object" || !Array.isArray((input as { items?: unknown }).items)) {
        throw new HttpError(400, "Invalid documentation configuration");
    }
    const rawItems = (input as { items: unknown[] }).items;
    if (rawItems.length === 0) {
        throw new HttpError(400, "Documentation must contain at least one section");
    }

    const items: DocItem[] = rawItems.map((raw, index) => {
        if (!raw || typeof raw !== "object") {
            throw new HttpError(400, `Invalid documentation item at index ${index}`);
        }
        const item = raw as Partial<DocItem>;
        const title = typeof item.title === "string" ? item.title.trim() : "";
        const slug = typeof item.slug === "string" ? item.slug.trim() : "";
        const description = typeof item.description === "string" ? item.description.trim() : "";
        const content = typeof item.content === "string" ? item.content : "";

        if (!title) throw new HttpError(400, "Documentation title is required");
        if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
            throw new HttpError(400, `Invalid documentation slug: ${slug || "(empty)"}`);
        }
        if (!content.trim()) throw new HttpError(400, `Documentation content is required for "${title}"`);

        return {
            id: item.id || slug,
            slug,
            title,
            description,
            content,
            updatedAt: new Date().toISOString(),
        };
    });

    const newConfig: DocsConfig = { items };
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("site_settings").upsert({
        key: "docs_config",
        value: JSON.stringify(newConfig),
        is_public: true,
        updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);
    revalidateTag("site-settings", "max");
    revalidateTag("site-docs", "max");
    revalidatePath("/docs");
    return newConfig;
}

