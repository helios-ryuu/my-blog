import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listPosts } from "@/lib/posts-db";
import { PostCard } from "@/components/features/post";
import PageHeader from "@/components/layout/PageHeader";

interface Props {
    params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

const getCachedTagPosts = unstable_cache(
    async (slug: string) => {
        const supabase = createSupabaseAdminClient();
        const { data: tagRow } = await supabase
            .from("tag")
            .select("id, name, slug")
            .eq("slug", slug)
            .maybeSingle();
        if (!tagRow) return null;
        const { items } = await listPosts(supabase, { tag: slug, publishedOnly: true, pageSize: 50 });
        return { tag: tagRow as { id: number; name: string; slug: string }, items };
    },
    ["tag-posts"],
    { revalidate: 60, tags: ["posts", "tags"] },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const data = await getCachedTagPosts(slug);
    if (!data) return { title: "Tag không tồn tại — Toán Mô Hình Hà Nội" };
    return {
        title: `Tag: ${data.tag.name} — Toán Mô Hình Hà Nội`,
        description: `Các bài viết với tag #${data.tag.name}`,
    };
}

export default async function TagPage({ params }: Props) {
    const { slug } = await params;
    const data = await getCachedTagPosts(slug);

    if (!data) {
        notFound();
    }

    const { tag, items } = data;

    return (
        <div className="w-full px-4 py-8 md:px-10">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-1">
                    <Link href="/post" className="text-xs text-foreground/60 hover:text-accent transition-colors">
                        ← Tất cả bài viết
                    </Link>
                </div>
                <PageHeader
                    title={`#${tag.name}`}
                    description={`${items.length} bài viết với tag này`}
                    className="mt-2"
                />

                <Suspense fallback={<div className="text-foreground/60">Đang tải...</div>}>
                    {items.length === 0 ? (
                        <p className="mt-6 text-foreground/50">Không tìm thấy bài viết nào cho tag này.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {items.map((p) => {
                                const date = p.published_at ?? p.created_at;
                                return (
                                    <Link key={p.id} href={`/post/${p.slug}`} className="block">
                                        <PostCard
                                            slug={p.slug}
                                            image={p.image_url ?? undefined}
                                            title={p.title}
                                            description={p.description}
                                            date={new Date(date).toISOString().split("T")[0]}
                                            tags={p.tags.map((t) => t.name)}
                                            category={p.category}
                                        />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </Suspense>
            </div>
        </div>
    );
}
