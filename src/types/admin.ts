/**
 * Shared admin types — used across admin forms, sections, and selectors.
 * Mirrors the new Supabase schema (no author/series; category enum).
 */

import type { PostCategory } from "./database";

export interface AdminTag {
    id: number;
    name: string;
    slug?: string;
    created_at?: string;
}

export interface AdminPost {
    id: number;
    title: string;
    slug: string;
    description: string;
    content?: string;
    image_url?: string | null;
    category: PostCategory;
    published: boolean;
    published_at?: string | null;
    tags?: string[];
    created_at?: string;
    updated_at?: string | null;
    [key: string]: unknown;
}

export const CATEGORIES: PostCategory[] = ["news", "announcement", "tutorial", "result"];
export const STATUSES = ["all", "published", "draft"] as const;

export const CHAR_LIMITS = {
    title: 120,
    description: 300,
    content: 50000,
} as const;
