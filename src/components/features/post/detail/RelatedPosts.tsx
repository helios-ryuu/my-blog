"use client";

import Link from "next/link";
import Image from "next/image";
import { shouldBypassImageOptimization } from "@/lib/images";
import type { PostMeta } from "@/types/post";

interface RelatedPostsProps {
    posts: PostMeta[];
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
    if (posts.length === 0) return null;

    return (
        <aside className="sticky">
            <h4 className="text-sm font-semibold text-foreground/70 mb-4 uppercase tracking-wider">
                Related Posts
            </h4>
            <div className="space-y-4">
                {posts.slice(0, 3).map((post) => (
                    <Link
                        key={post.slug}
                        href={`/post/${post.slug}`}
                        className="block group"
                    >
                        <article className="flex gap-3">
                            {post.image && (
                                <div className="relative w-16 h-16 flex-none rounded-lg overflow-hidden">
                                    <Image
                                        src={post.image}
                                        alt={post.title}
                                        fill
                                        className="object-cover"
                                        unoptimized={shouldBypassImageOptimization(post.image)}
                                    />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h5 className="text-xs font-medium line-clamp-2 group-hover:text-accent transition-colors">
                                    {post.title}
                                </h5>
                                <p className="text-[10px] text-foreground/50 mt-1">
                                    {post.date}
                                </p>
                            </div>
                        </article>
                    </Link>
                ))}
            </div>
        </aside>
    );
}
