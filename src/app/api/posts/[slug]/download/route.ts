import { createSupabasePublicClient } from "@/lib/supabase/public";
import { getPostBySlug } from "@/lib/posts-db";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
    const { slug } = await context.params;
    const post = await getPostBySlug(createSupabasePublicClient(), slug);

    if (!post) return new Response("Post not found", { status: 404 });

    return new Response(post.content, {
        headers: {
            "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
            "Content-Disposition": `attachment; filename="${post.slug}.md"`,
            "Content-Type": "text/markdown; charset=utf-8",
        },
    });
}
