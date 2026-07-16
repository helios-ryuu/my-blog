import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export class HttpError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message);
        this.name = "HttpError";
    }
}

export function apiSuccess<T>(data: T, message?: string): NextResponse {
    return NextResponse.json({ success: true, data, ...(message ? { message } : {}) });
}

export function apiMessage(message: string): NextResponse {
    return NextResponse.json({ success: true, message });
}

export function apiError(message: string, status = 500): NextResponse {
    return NextResponse.json({ success: false, message }, { status });
}

export async function parseIdParam(
    params: Promise<{ id: string }>,
    entityName = "ID",
): Promise<number | NextResponse> {
    const { id } = await params;
    const parsed = Number(id);
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(parsed)) {
        return apiError(`Invalid ${entityName}`, 400);
    }
    return parsed;
}

export function revalidatePosts(slug?: string): void {
    revalidateTag("posts", "max");
    if (slug) revalidateTag(`post-${slug}`, "max");
    revalidatePath("/");
    revalidatePath("/post");
}

export function revalidateTags(): void {
    revalidateTag("tags", "max");
    revalidatePosts();
}

export function revalidateCategories(): void {
    revalidateTag("categories", "max");
    revalidatePath("/about");
    revalidatePath("/category/[type]", "page");
    revalidatePosts();
}

export function revalidateSeries(): void {
    revalidateTag("series", "max");
    revalidatePosts();
}

export function handleRouteError(err: unknown): NextResponse {
    if (err instanceof HttpError) return apiError(err.message, err.status);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "UNAUTHORIZED") return apiError("Unauthorized", 401);
    if (message === "FORBIDDEN") return apiError("Forbidden", 403);
    console.error("API route error:", err);
    return apiError("Internal server error", 500);
}
