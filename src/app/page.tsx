import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getAllPostsMeta } from "@/lib/posts";
import HomeHero from "@/components/features/home/HomeHero";
import RecentPostsBento from "@/components/features/home/RecentPostsBento";

const getCachedPosts = unstable_cache(
    async () => getAllPostsMeta(),
    ["home-posts"],
    { revalidate: 120, tags: ["posts"] },
);

export default async function Home() {
    const [posts, t] = await Promise.all([getCachedPosts(), getTranslations("home")]);

    return (
        <div className="mx-auto w-full max-w-7xl px-4">
            {/* Centered Hero Viewport */}
            <HomeHero
                heroLead={t("heroLead")}
                explorePostsText={t("explorePosts")}
                aboutAuthorText={t("aboutAuthor")}
            />

            {/* Below the fold: Recent Posts Bento */}
            <section id="recent-posts" className="py-16 md:py-24 border-t border-(--border-color)/60">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-accent">
                            {t("latestPosts")}
                        </h2>
                    </div>
                    <Link
                        href="/post"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-accent hover:opacity-80 transition-opacity"
                    >
                        {t("viewAll")} <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Link>
                </div>

                <RecentPostsBento posts={posts} emptyMessage={t("emptyPosts")} />
            </section>
        </div>
    );
}
