/**
 * Shared admin types — used across admin forms, sections, and selectors.
 * Mirrors the Supabase schema used by the CMS.
 */

import {
    POST_LEVELS,
    type DbCategory,
    type DbSeries,
    type PostCategory,
    type PostLevel,
    type PostType,
} from "./database";

export interface AdminCategory extends DbCategory {
    post_count: number;
}

export interface AdminSeries extends DbSeries {
    post_count: number;
}

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
    level: PostLevel;
    reading_time: number;
    type: PostType;
    series_id: number | null;
    series_order: number | null;
    series?: DbSeries | null;
    published: boolean;
    published_at?: string | null;
    tags?: AdminTag[];
    created_at?: string;
    updated_at?: string | null;
    [key: string]: unknown;
}

export const LEVELS = POST_LEVELS;

export const CHAR_LIMITS = {
    title: 120,
    description: 300,
    content: 50000,
} as const;
