"use client";

import Link from "next/link";
import { MouseEvent } from "react";

interface TagListProps {
    tags: string[];
    variant?: "compact" | "default";
    className?: string;
    showLeadingHash?: boolean;
}

export default function TagList({ tags, variant = "default", className = "", showLeadingHash = false }: TagListProps) {
    if (!tags || tags.length === 0) return null;

    const variants = {
        compact: "gap-1",
        default: "gap-1"
    };

    const tagStyles = {
        compact: "px-2 py-0.5 text-xs rounded transition-colors hover:bg-accent/40",
        default: "px-2.5 py-0.5 text-xs rounded-[4px] transition-colors hover:bg-accent/40"
    };

    const handleTagClick = (e: MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className={`flex flex-wrap items-center ${variants[variant]} ${className}`}>
            {showLeadingHash && (
                <span className="text-xs font-semibold text-accent/90 select-none">#</span>
            )}
            {tags.map((tag) => (
                <Link
                    key={tag}
                    href={`/post?tag=${encodeURIComponent(tag.toLowerCase())}`}
                    onClick={handleTagClick}
                    className={`bg-accent/20 text-accent ${tagStyles[variant]}`}
                >
                    {tag}
                </Link>
            ))}
        </div>
    );
}
