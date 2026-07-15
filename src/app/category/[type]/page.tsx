import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { listPosts } from "@/lib/posts-db";
import { PostCard } from "@/components/features/post";
import PageHeader from "@/components/layout/PageHeader";
import type { PostCategory } from "@/types/database";

const VALID_CATEGORIES: PostCategory[] = ["news", "announcement", "tutorial", "result"];

const CATEGORY_LABEL: Record<PostCategory, string> = {
    news: "Tin tức",
    announcement: "Thông báo",
    tutorial: "Hướng dẫn",
    result: "Kết quả",
};

const CATEGORY_DESCRIPTION: Record<PostCategory, string> = {
    news: "Tin tức và cập nhật mới nhất từ Toán Mô Hình Hà Nội.",
    announcement: "Thông báo chính thức từ ban tổ chức.",
    tutorial: "Bài hướng dẫn, tài liệu học tập.",
    result: "Kết quả các kỳ thi và hoạt động.",
};

interface Props {
    params: Promise<{ type: string }>;
}

const getCachedCategoryPosts = unstable_cache(
    async (category: PostCategory) => {
        const supabase = createSupabaseAdminClient();
        const { items } = await listPosts(supabase, { category, publishedOnly: true, pageSize: 50 });
        return items;
    },
    ["category-posts"],
    { revalidate: 60, tags: ["posts"] },
);

export async function generateStaticParams() {
    return VALID_CATEGORIES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { type } = await params;
    if (!VALID_CATEGORIES.includes(type as PostCategory)) {
        return { title: "Không tìm thấy — Toán Mô Hình Hà Nội" };
    }
    const cat = type as PostCategory;
    return {
        title: `${CATEGORY_LABEL[cat]} — Toán Mô Hình Hà Nội`,
        description: CATEGORY_DESCRIPTION[cat],
    };
}

export default async function CategoryPage({ params }: Props) {
    const { type } = await params;
    if (!VALID_CATEGORIES.includes(type as PostCategory)) {
        notFound();
    }
    const category = type as PostCategory;
    const items = await getCachedCategoryPosts(category);

    return (
        <div className="w-full px-4 py-8 md:px-10">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-1">
                    <Link href="/post" className="text-xs text-foreground/60 hover:text-accent transition-colors">
                        ← Tất cả bài viết
                    </Link>
                </div>
                <PageHeader
                    title={CATEGORY_LABEL[category]}
                    description={CATEGORY_DESCRIPTION[category]}
                    className="mt-2"
                />

                {items.length === 0 ? (
                    <p className="mt-6 text-foreground/50">Chưa có bài viết nào trong mục này.</p>
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
            </div>
        </div>
    );
}
