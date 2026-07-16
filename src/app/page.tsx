import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ArrowRight, PenLine } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { shouldBypassImageOptimization } from "@/lib/images";
import { getAllPostsMeta } from "@/lib/posts";
import type { PostMeta } from "@/types/post";

const getCachedPosts = unstable_cache(
    async () => getAllPostsMeta(),
    ["home-posts"],
    { revalidate: 120, tags: ["posts"] },
);

function LatestPost({ post, prominent = false }: { post: PostMeta; prominent?: boolean }) {
    return (
        <Link
            href={`/post/${post.slug}`}
            className={`group grid overflow-hidden rounded-[8px] border border-(--border-color) bg-(--post-card)/90 transition-colors hover:border-accent/55 hover:bg-(--post-card-hover) ${prominent ? "grid-cols-1 sm:grid-cols-[minmax(160px,0.8fr)_1.2fr]" : "grid-cols-[88px_1fr]"}`}
        >
            <div className={`relative overflow-hidden bg-background-hover ${prominent ? "min-h-44 sm:min-h-full" : "min-h-28"}`}>
                {post.image ? (
                    <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes={prominent ? "(max-width: 640px) 100vw, 300px" : "88px"}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized={shouldBypassImageOptimization(post.image)}
                    />
                ) : (
                    <div className="absolute inset-0 bg-accent/12" />
                )}
            </div>
            <div className="flex min-w-0 flex-col p-3.5">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-foreground/50">
                    {post.date && <span>{post.date}</span>}
                    {post.tags?.[0] && <span>#{post.tags[0]}</span>}
                </div>
                <h2 className={`${prominent ? "text-lg" : "text-sm"} line-clamp-2 font-semibold leading-snug group-hover:text-accent`}>{post.title}</h2>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground/62">{post.description}</p>
            </div>
        </Link>
    );
}

export default async function Home() {
    const [posts, t] = await Promise.all([getCachedPosts(), getTranslations("home")]);
    const [leadPost, ...morePosts] = posts.slice(0, 4);

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:py-24">
            <section className="grid min-h-[430px] items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
                <div className="max-w-2xl">
                    <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground/60">
                        <PenLine className="h-4 w-4 text-accent" />
                        {t("heroEyebrow")}
                    </div>
                    <h1 className="text-4xl font-extrabold leading-tight text-accent md:text-5xl">Helios Blog</h1>
                    <p className="mt-5 max-w-xl text-base leading-8 text-foreground/78">{t("heroLead")}</p>
                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link href="/post" className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-accent bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
                            {t("explorePosts")}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link href="/about" className="inline-flex h-10 items-center rounded-[8px] border border-(--border-color) bg-background/70 px-4 text-sm font-semibold transition-colors hover:border-accent/60 hover:text-accent">
                            {t("aboutAuthor")}
                        </Link>
                    </div>
                </div>

                <div>
                    <div className="mb-4 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-foreground/55">{t("latestEyebrow")}</p>
                            <h2 className="mt-1 text-xl font-bold">{t("latestPosts")}</h2>
                        </div>
                        <Link href="/post" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                            {t("viewAll")} <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {leadPost ? (
                        <div className="grid gap-3">
                            <LatestPost post={leadPost} prominent />
                            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                                {morePosts.map((post) => <LatestPost key={post.slug} post={post} />)}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-[8px] border border-dashed border-(--border-color) bg-background/60 px-5 py-12 text-center text-sm text-foreground/55">
                            {t("emptyPosts")}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
