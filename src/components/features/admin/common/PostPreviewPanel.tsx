"use client";

import { Eye, Loader2 } from "lucide-react";
import Image from "next/image";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { mdxComponents } from "@/../mdx-components";
import type { AdminTag } from "@/types/admin";
import type { PostCategory } from "@/types/database";

interface PostPreviewPanelProps {
    title: string;
    description: string;
    imageUrl: string;
    category: PostCategory | "";
    selectedTags: number[];
    tags: AdminTag[];
    mdxSource: MDXRemoteSerializeResult | null;
    isRendering?: boolean;
}

const CATEGORY_STYLES: Record<string, string> = {
    news: "bg-blue-500/20 text-blue-500",
    announcement: "bg-purple-500/20 text-purple-500",
    tutorial: "bg-green-500/20 text-green-500",
    result: "bg-amber-500/20 text-amber-500",
};

export function PostPreviewPanel({
    title,
    description,
    imageUrl,
    category,
    selectedTags,
    tags,
    mdxSource,
    isRendering,
}: PostPreviewPanelProps) {
    return (
        <div className="flex-1 min-w-0 h-full flex flex-col bg-background">
            <div className="flex items-center gap-2 p-4 border-b border-(--border-color) text-foreground/70">
                <Eye size={18} />
                <span className="font-semibold text-lg">Preview</span>
                {isRendering && (
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-foreground/50">
                        <Loader2 size={12} className="animate-spin" />
                        Rendering…
                    </span>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">{title || "Untitled"}</h1>
                    <p className="text-sm mt-2 text-foreground/70">{description || "No description"}</p>
                    <div className="flex items-center gap-2 text-foreground/50 text-sm mt-4 mb-3">
                        {category && (
                            <span className={`px-2 py-0.5 rounded-sm text-xs font-medium ${CATEGORY_STYLES[category] || ""}`}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </span>
                        )}
                    </div>
                    {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {selectedTags.map((tagId) => {
                                const tag = tags.find((t) => t.id === tagId);
                                return tag ? (
                                    <span
                                        key={tag.id}
                                        className="px-2.5 py-0.5 text-xs rounded-[4px] bg-accent/20 text-accent"
                                    >
                                        {tag.name}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    )}
                </header>

                {imageUrl && (
                    <div className="mb-6 rounded-lg overflow-hidden border border-(--border-color)">
                        <Image
                            src={imageUrl}
                            alt={title}
                            width={0}
                            height={0}
                            sizes="100vw"
                            className="w-full h-auto object-cover"
                            unoptimized
                        />
                    </div>
                )}

                <div className="prose prose-invert max-w-none">
                    {mdxSource ? (
                        <MDXRemote {...mdxSource} components={mdxComponents} />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-foreground/40 italic gap-2">
                            <p>Preview will appear as you type…</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
