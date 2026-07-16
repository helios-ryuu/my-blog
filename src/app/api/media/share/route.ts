import { getMediaObject } from "@/lib/storage";

export const runtime = "nodejs";

function errorStatus(error: unknown): number {
    return (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode === 404
        ? 404
        : 500;
}

export async function GET(request: Request) {
    const source = new URL(request.url).searchParams.get("url");
    const publicBaseUrl = process.env.R2_PUBLIC_URL?.trim();
    if (!source || !publicBaseUrl) return new Response("Media not found", { status: 404 });

    try {
        const sourceUrl = new URL(source);
        const publicUrl = new URL(publicBaseUrl);
        if (sourceUrl.protocol !== "https:" || sourceUrl.origin !== publicUrl.origin) {
            return new Response("Media not found", { status: 404 });
        }

        const key = sourceUrl.pathname
            .split("/")
            .filter(Boolean)
            .map(decodeURIComponent)
            .join("/");
        const object = await getMediaObject(key);
        if (!object.Body) return new Response("Media not found", { status: 404 });

        const headers = new Headers({
            "Cache-Control": object.CacheControl || "public, max-age=3600, stale-while-revalidate=86400",
            "Content-Type": object.ContentType || "application/octet-stream",
            "X-Content-Type-Options": "nosniff",
        });
        if (object.ContentLength !== undefined) headers.set("Content-Length", String(object.ContentLength));
        if (object.ETag) headers.set("ETag", object.ETag);
        if (object.LastModified) headers.set("Last-Modified", object.LastModified.toUTCString());

        return new Response(object.Body.transformToWebStream(), { headers });
    } catch (error) {
        const status = errorStatus(error);
        return new Response(status === 404 ? "Media not found" : "Unable to load media", { status });
    }
}
