import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/supabase/server";
import {
    MEDIA_BUCKET_NAME,
    cleanStoragePath,
    createMediaFolder,
    deleteMediaObjects,
    getMediaUrl,
    listMedia,
    listMediaKeys,
    moveMediaFolder,
    moveMediaObject,
    uploadMediaFile,
} from "@/lib/storage";

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
        const prefix = req.nextUrl.searchParams.get("prefix") ?? "";
        const entries = await listMedia(prefix);
        return apiSuccess({ bucket: MEDIA_BUCKET_NAME, prefix: cleanStoragePath(prefix), ...entries });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
        const contentType = req.headers.get("content-type") ?? "";

        if (contentType.includes("application/json")) {
            const body = await req.json().catch(() => ({}));
            if (body.action !== "create-folder" || typeof body.path !== "string") {
                return apiError("action=create-folder and path are required", 400);
            }
            return apiSuccess({ path: await createMediaFolder(body.path) });
        }

        const form = await req.formData();
        const file = form.get("file");
        const prefixValue = form.get("prefix");
        const prefix = typeof prefixValue === "string" ? prefixValue : "";
        if (!(file instanceof File)) return apiError("file is required", 400);
        return apiSuccess(await uploadMediaFile(file, prefix));
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await requireAdmin();
        const body = await req.json().catch(() => ({}));
        if (typeof body.path !== "string" || !body.path) return apiError("path is required", 400);

        const targets = body.type === "folder"
            ? await listMediaKeys(body.path)
            : [cleanStoragePath(body.path)];
        await deleteMediaObjects(targets);
        return apiSuccess({ path: body.path, removed: targets.length });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await requireAdmin();
        const body = await req.json().catch(() => ({}));
        if (typeof body.from !== "string" || typeof body.to !== "string") {
            return apiError("from and to are required", 400);
        }

        if (body.type === "folder") {
            const moved = await moveMediaFolder(body.from, body.to);
            return apiSuccess({ path: cleanStoragePath(body.to), moved });
        }

        const path = await moveMediaObject(body.from, body.to);
        return apiSuccess({ path, publicUrl: getMediaUrl(path) });
    } catch (error) {
        return handleRouteError(error);
    }
}
