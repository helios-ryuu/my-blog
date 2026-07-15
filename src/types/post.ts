import type { PostCategory } from "./database";

export type Level = "beginner" | "intermediate" | "advanced";

export interface PostFrontmatter {
    title: string;
    description: string;
    date: string;
    image?: string;
    tags?: string[];
    level?: Level;
    category?: PostCategory;
}

export interface Post extends PostFrontmatter {
    slug: string;
    content: string;
    readingTime: string;
}

export interface PostMeta extends PostFrontmatter {
    slug: string;
    readingTime: string;
}

/** Shared props for PostCard and PostListItem */
export interface PostItemProps {
    slug: string;
    image?: string;
    title: string;
    description: string;
    date?: string;
    readingTime?: string;
    level?: Level;
    tags?: string[];
    category?: PostCategory;
    onClick?: () => void;
    className?: string;
}
