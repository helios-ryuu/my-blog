import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export type ApiResponse<T> =
    | { success: true; data: T; message?: string }
    | { success: false; message: string };

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
    const parsed = parseInt(id, 10);
    if (Number.isNaN(parsed)) {
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

export function revalidateContests(slug?: string): void {
    revalidateTag("contests", "max");
    if (slug) revalidateTag(`contest-${slug}`, "max");
    revalidatePath("/contests");
}

export function revalidateTags(): void {
    revalidateTag("tags", "max");
}

export function handleRouteError(err: unknown): NextResponse {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "UNAUTHORIZED") return apiError("Unauthorized", 401);
    if (message === "FORBIDDEN") return apiError("Forbidden", 403);
    return apiError(message, 500);
}
