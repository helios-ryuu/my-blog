import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { shouldBypassImageOptimization } from "@/lib/images";
import { getAllPostsMeta } from "@/lib/posts";
import type { PostMeta } from "@/types/post";
import HomeHero from "@/components/features/home/HomeHero";
import GlareHover from "@/components/ui/GlareHover";

const getCachedPosts = unstable_cache(
    async () => getAllPostsMeta(),
    ["home-posts"],
    { revalidate: 120, tags: ["posts"] },
);

function LatestPost({ post, prominent = false }: { post: PostMeta; prominent?: boolean }) {
    return (
        <GlareHover
            glareColor="#ffffff"
            glareOpacity={0.25}
            glareAngle={-35}
            glareSize={250}
            transitionDuration={700}
            borderRadius="8px"
            className="w-full h-full"
        >
            <Link
                href={`/post/${post.slug}`}
                className={`group grid w-full h-full overflow-hidden rounded-[8px] border border-(--border-color) bg-(--post-card)/90 backdrop-blur-xs transition-all hover:border-accent/55 hover:bg-(--post-card-hover) hover:shadow-md ${prominent ? "grid-cols-1 sm:grid-cols-[minmax(180px,0.8fr)_1.2fr]" : "grid-cols-[88px_1fr]"}`}
            >
                <div className={`relative overflow-hidden bg-background-hover ${prominent ? "min-h-48 sm:min-h-full" : "min-h-28"}`}>
                    {post.image ? (
                        <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            sizes={prominent ? "(max-width: 640px) 100vw, 400px" : "88px"}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            unoptimized={shouldBypassImageOptimization(post.image)}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-accent/12" />
                    )}
                </div>
                <div className="flex min-w-0 flex-col p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-foreground/50">
                        {post.date && <span>{post.date}</span>}
                        {post.tags?.[0] && <span>#{post.tags[0]}</span>}
                    </div>
                    <h2 className={`${prominent ? "text-lg font-bold" : "text-sm font-semibold"} line-clamp-2 leading-snug group-hover:text-accent transition-colors`}>{post.title}</h2>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground/62">{post.description}</p>
                </div>
            </Link>
        </GlareHover>
    );
}

export default async function Home() {
    const [posts, t] = await Promise.all([getCachedPosts(), getTranslations("home")]);
    const [leadPost, ...morePosts] = posts.slice(0, 4);

    return (
        <div className="mx-auto w-full max-w-7xl px-4">
            {/* Centered Hero Viewport */}
            <HomeHero
                heroLead={t("heroLead")}
                explorePostsText={t("explorePosts")}
                aboutAuthorText={t("aboutAuthor")}
            />

            {/* Below the fold: Recent Posts */}
            <section id="recent-posts" className="py-16 md:py-24 border-t border-(--border-color)/60">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-mono uppercase tracking-widest text-accent">
                            {t("latestEyebrow")}
                        </span>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            {t("latestPosts")}
                        </h2>
                    </div>
                    <Link
                        href="/post"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                    >
                        {t("viewAll")} <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {leadPost ? (
                    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                        <LatestPost post={leadPost} prominent />
                        <div className="flex flex-col gap-3">
                            {morePosts.map((post) => (
                                <LatestPost key={post.slug} post={post} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-[8px] border border-dashed border-(--border-color) bg-background/60 px-5 py-16 text-center text-sm text-foreground/55">
                        {t("emptyPosts")}
                    </div>
                )}
            </section>
        </div>
    );
}
