import type { PostCategory, PostLevel, PostType } from "./database";

interface PostSeriesMeta {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
}

interface PostFrontmatter {
    title: string;
    description: string;
    date: string;
    image?: string;
    tags?: string[];
    category?: PostCategory;
    categoryName?: string;
    categoryIcon?: string | null;
    level: PostLevel;
    readingTime: number;
    type: PostType;
    series?: PostSeriesMeta | null;
    seriesOrder?: number | null;
}

export interface Post extends PostFrontmatter {
    slug: string;
    content: string;
}

export interface PostMeta extends PostFrontmatter {
    slug: string;
}

/** Shared props for PostCard and PostListItem */
export interface PostItemProps {
    slug: string;
    image?: string;
    title: string;
    description: string;
    date?: string;
    tags?: string[];
    category?: PostCategory;
    categoryName?: string;
    categoryIcon?: string | null;
    level: PostLevel;
    readingTime: number;
    type: PostType;
    series?: PostSeriesMeta | null;
    seriesOrder?: number | null;
    onClick?: () => void;
    className?: string;
}
