import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Trophy, Users } from "lucide-react";
import { getAllPostsMeta } from "@/lib/posts";
import { shouldBypassImageOptimization } from "@/lib/images";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listContests } from "@/lib/contests-db";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import type { PostMeta } from "@/types/post";
import type { ContestWithStages } from "@/types/database";

const getCachedPosts = unstable_cache(
  async () => getAllPostsMeta(),
  ["home-posts"],
  { revalidate: 120, tags: ["posts"] }
);

const getCachedContests = unstable_cache(
  async () => {
    const supabase = createSupabaseAdminClient();
    return listContests(supabase, { includeAll: true, withStages: true }) as Promise<ContestWithStages[]>;
  },
  ["home-contests"],
  { revalidate: 120, tags: ["contests"] }
);

function pickRandom(posts: PostMeta[], count: number): PostMeta[] {
  if (posts.length <= count) return posts;
  const shuffled = [...posts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function pickContests(contests: ContestWithStages[], count: number): ContestWithStages[] {
  return [...contests]
    .sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return new Date(b.start_at).getTime() - new Date(a.start_at).getTime();
    })
    .slice(0, count);
}

function formatDateRange(start: string, end: string): string {
  const opts = { day: "2-digit", month: "2-digit", year: "numeric" } as const;
  return `${new Date(start).toLocaleDateString("vi-VN", opts)} - ${new Date(end).toLocaleDateString("vi-VN", opts)}`;
}

function FeaturedPostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/post/${post.slug}`}
      className="group grid grid-cols-[92px_1fr] overflow-hidden rounded-[8px] border border-(--border-color) bg-(--post-card)/88 transition-colors hover:border-(--border-color-hover) hover:bg-(--post-card-hover)"
    >
      <div className="relative min-h-28 overflow-hidden bg-background-hover">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="92px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={shouldBypassImageOptimization(post.image)}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(31,81,255,0.28),transparent_34%),linear-gradient(135deg,var(--post-card),var(--background-hover))]" />
        )}
      </div>
      <div className="flex min-w-0 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-accent">
          {post.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-foreground/66">
          {post.description}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-3 text-[11px] text-foreground/52">
          {post.date && <span>{post.date}</span>}
          {post.tags && post.tags.length > 0 && (
            <>
              <span>·</span>
              <span className="truncate">{post.tags.slice(0, 2).join(", ")}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function Home() {
  const [allPosts, allContests] = await Promise.all([getCachedPosts(), getCachedContests()]);
  const featured = pickRandom(allPosts, 3);
  const contests = pickContests(allContests, 4);
  const t = await getTranslations("home");
  const tStatus = await getTranslations("contestStatus");
  const tType = await getTranslations("contestType");

  const highlights = [
    {
      icon: BookOpen,
      title: t("card1Title"),
      description: t("card1Desc"),
    },
    {
      icon: Trophy,
      title: t("card2Title"),
      description: t("card2Desc"),
    },
    {
      icon: Users,
      title: t("card3Title"),
      description: t("card3Desc"),
    },
  ];

  return (
    <div className="flex-1">
      <section className="mx-auto grid min-h-[calc(100vh-13rem)] max-w-7xl grid-cols-1 gap-8 py-10 md:py-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-center">
        <div>
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground/80">
            {t("heroEyebrow")}
          </div>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-accent md:text-5xl">
            Toán Mô Hình Hà Nội
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-foreground/85 md:text-md">
            {t("heroLead")}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/contests"
              className="inline-flex items-center gap-2 rounded-[8px] border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-accent-hover hover:bg-accent-hover"
            >
              {t("contestsBtn")}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link
              href="/post"
              className="inline-flex items-center gap-2 rounded-[8px] border border-(--border-color) bg-background/72 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/70 hover:text-accent"
            >
              {t("explorePosts")}
            </Link>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:max-w-7xl">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <section
                  key={item.title}
                  className="rounded-[8px] border border-(--border-color) bg-(--post-card)/84 p-4 backdrop-blur-sm"
                >
                  <Icon className="mb-3 h-5 w-5 text-accent" strokeWidth={2.5} />
                  <h2 className="text-sm font-semibold">{item.title}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-foreground/66">{item.description}</p>
                </section>
              );
            })}
          </div>
        </div>

        <aside className="space-y-8 lg:justify-self-end">
          {featured.length > 0 && (
            <section>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-foreground/62">
                    {t("featuredEyebrow")}
                  </div>
                  <h2 className="mt-2 text-2xl font-bold uppercase tracking-widest text-accent">
                    {t("featuredPosts")}
                  </h2>
                </div>
                <Link
                  href="/post"
                  className="group inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                >
                  {t("viewAll")}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <div className="grid gap-3">
                {featured.map((post) => (
                  <FeaturedPostCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          )}

          {contests.length > 0 && (
            <section>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-foreground/62">
                    {t("contestsEyebrow")}
                  </div>
                  <h2 className="mt-2 text-2xl font-bold uppercase tracking-widest text-accent">
                    {t("featuredContests")}
                  </h2>
                </div>
                <Link
                  href="/contests"
                  className="group inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                >
                  {t("viewAll")}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <div className="divide-y divide-(--border-color) overflow-hidden rounded-[8px] border border-(--border-color) bg-(--post-card)/88">
                {contests.map((contest) => (
                  <Link
                    key={contest.slug}
                    href={`/contests/${contest.slug}`}
                    className="group grid gap-2 px-3 py-3 transition-colors hover:bg-(--post-card-hover) sm:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold group-hover:text-accent">{contest.title}</h3>
                      <p className="mt-1 text-xs text-foreground/56">{formatDateRange(contest.start_at, contest.end_at)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    <span className="rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                        {tStatus(contest.status)}
                      </span>
                      <span className="rounded border border-(--border-color) bg-background/60 px-2 py-0.5 text-[11px] text-foreground/64">
                        {tType(contest.participation_type)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </section>
    </div>
  );
}
