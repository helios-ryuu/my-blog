import { getMediaObject } from "@/lib/storage";

export const runtime = "nodejs";

interface RouteContext {
    params: Promise<{ key: string[] }>;
}

function statusFromError(error: unknown): number {
    const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    return status === 404 ? 404 : 500;
}

export async function GET(_request: Request, { params }: RouteContext) {
    try {
        const { key } = await params;
        const object = await getMediaObject(key.join("/"));
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
        const status = statusFromError(error);
        return new Response(status === 404 ? "Media not found" : "Unable to load media", { status });
    }
}
