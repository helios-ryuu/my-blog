// Database row types - mirror the Supabase schema in supabase/schema.sql.

export type PostCategory = string;
export const POST_TYPES = ["standalone", "series"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const POST_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type PostLevel = (typeof POST_LEVELS)[number];

export const POST_LEVEL_LABEL_KEYS: Record<PostLevel, "levelBeginner" | "levelIntermediate" | "levelAdvanced"> = {
    beginner: "levelBeginner",
    intermediate: "levelIntermediate",
    advanced: "levelAdvanced",
};

export interface DbCategory {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    description: string;
    examples: string;
    display_order: number;
    created_at: string;
    updated_at: string | null;
}

export interface DbSeries {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface DbPost {
    id: number;
    slug: string;
    title: string;
    description: string;
    content: string;
    image_url: string | null;
    category: PostCategory;
    level: PostLevel;
    reading_time: number;
    series_id: number | null;
    series_order: number | null;
    published: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string | null;
}

export interface DbTag {
    id: number;
    name: string;
    slug: string;
    created_at: string;
}

export interface DbPostWithRelations extends DbPost {
    tags: DbTag[];
    series: DbSeries | null;
    type: PostType;
}

export type DbPostSummary = Omit<DbPost, "content">;

export interface DbPostSummaryWithRelations extends DbPostSummary {
    tags: DbTag[];
    series: DbSeries | null;
    type: PostType;
}
