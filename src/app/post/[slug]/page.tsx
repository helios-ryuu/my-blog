import { getPostBySlug, getRelatedPosts } from "@/lib/posts";
import { shouldBypassImageOptimization } from "@/lib/images";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "../../../../mdx-components";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { PostMeta, RelatedPosts, MobileTocBar, PostShareActions, PostCategoryBadge, TableOfContents } from "@/components/features/post";
import { TagList } from "@/components/ui";
import { Metadata } from "next";
import { unstable_cache } from "next/cache";

// Cache post data for faster subsequent loads
const getCachedPost = unstable_cache(
    async (slug: string) => getPostBySlug(slug),
    ["post"],
    { revalidate: 60, tags: ["posts"] }
);

const getCachedRelatedPosts = unstable_cache(
    async (slug: string, tags: string[]) => getRelatedPosts(slug, tags),
    ["related-posts"],
    { revalidate: 60, tags: ["posts"] }
);

interface Props {
    params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: "Post Not Found",
        };
    }

    return {
        title: `${post.title} - Toán Mô Hình Hà Nội`,
        description: post.description,
        openGraph: {
            title: post.title,
            description: post.description,
            siteName: "Toán Mô Hình Hà Nội",
            images: post.image ? [
                {
                    url: post.image,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ] : [],
            locale: "vi_VN",
            type: "article",
            publishedTime: post.date,
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.description,
            images: post.image ? [post.image] : [],
        },
    };
}

const rehypePrettyCodeOptions = {
    theme: "github-dark",
    keepBackground: true,
};

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await getCachedPost(slug);

    if (!post) {
        notFound();
    }

    const relatedPosts = await getCachedRelatedPosts(slug, post.tags || []);

    return (
        <div className="flex flex-col">
            {/* Mobile TOC Bar */}
            <div className="shrink-0 z-40">
                <MobileTocBar title={post.title} content={post.content} />
            </div>

            <div className="flex gap-2 px-4 md:px-0 max-w-dvw mx-auto w-full">
                <aside className="hidden md:block w-68 flex-none border-r border-(--border-color) bg-background">
                    <div className="sticky top-0 h-[calc(100vh-6rem)] overflow-hidden">
                        <TableOfContents content={post.content} />
                    </div>
                </aside>

                {/* Main Content */}
                <article className="flex-1 min-w-0 mx-auto py-6 md:py-4 md:px-6">
                    <header className="mb-8">
                        {/* Cover image (FR_POST_03) */}
                        {post.image && (
                            <div className="relative w-full h-56 md:h-72 mb-6 rounded-xl overflow-hidden border border-(--border-color)">
                                <Image
                                    src={post.image}
                                    alt={post.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 800px"
                                    className="object-cover"
                                    unoptimized={shouldBypassImageOptimization(post.image)}
                                    priority
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-background/30 via-transparent to-transparent" />
                            </div>
                        )}

                        {/* Category badge (FR_POST_03) */}
                        {post.category && (
                            <div className="mb-3">
                                <PostCategoryBadge category={post.category} />
                            </div>
                        )}

                        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
                        <p className="text-sm mt-2 text-foreground/70">{post.description}</p>
                        <PostMeta date={post.date} readingTime={post.readingTime} level={post.level} className="mt-4 mb-3" />
                        {post.tags && <TagList tags={post.tags} />}
                    </header>

                    <div className="prose prose-lg dark:prose-invert max-w-none pb-8">
                        <MDXRemote
                            source={post.content}
                            components={mdxComponents}
                            options={{
                                mdxOptions: {
                                    remarkPlugins: [remarkGfm],
                                    rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions]],
                                },
                            }}
                        />
                        <PostShareActions post={post} />
                    </div>
                </article>

                {/* Related posts panel */}
                <aside className="hidden xl:block w-62 flex-none pt-6 pb-10 px-2">
                    <div className="sticky top-0 max-h-[calc(100vh-6rem)] overflow-y-auto">
                        <RelatedPosts posts={relatedPosts} />
                    </div>
                </aside>
            </div>
        </div>
    );
}
