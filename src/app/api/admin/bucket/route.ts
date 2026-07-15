import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { POST_IMAGE_BUCKET, SUBMISSION_BUCKET } from "@/lib/storage";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-helpers";

type BucketName = typeof POST_IMAGE_BUCKET | typeof SUBMISSION_BUCKET;

const ALLOWED_BUCKETS: BucketName[] = [POST_IMAGE_BUCKET, SUBMISSION_BUCKET];

function pickBucket(req: NextRequest): BucketName | null {
    const raw = new URL(req.url).searchParams.get("bucket") ?? POST_IMAGE_BUCKET;
    return (ALLOWED_BUCKETS as string[]).includes(raw) ? (raw as BucketName) : null;
}

function safeFileName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/-+/g, "-");
}

function cleanPath(path: string): string {
    return path.replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
}

interface StorageEntry {
    name: string;
    id: string | null;
    updated_at: string | null;
    created_at: string | null;
    last_accessed_at?: string | null;
    metadata: { size?: number; mimetype?: string } | null;
}

async function listFilesRecursive(
    supabase: ReturnType<typeof createSupabaseAdminClient>,
    bucket: BucketName,
    prefix: string,
): Promise<string[]> {
    const cleanPrefix = cleanPath(prefix);
    const { data, error } = await supabase.storage.from(bucket).list(cleanPrefix, {
        limit: 1000,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(error.message);

    const paths: string[] = [];
    for (const entry of (data ?? []) as StorageEntry[]) {
        const fullPath = cleanPrefix ? `${cleanPrefix}/${entry.name}` : entry.name;
        const isFolder = entry.id === null && entry.metadata === null;
        if (isFolder) {
            paths.push(...await listFilesRecursive(supabase, bucket, fullPath));
        } else {
            paths.push(fullPath);
        }
    }
    return paths;
}

// GET — list entries (files + folders) under a prefix.
// query: bucket=<post-images|submissions>&prefix=<folder/subfolder>
export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
        const bucket = pickBucket(req);
        if (!bucket) return apiError("Invalid bucket", 400);

        const { searchParams } = new URL(req.url);
        const prefix = (searchParams.get("prefix") ?? "").replace(/^\/+|\/+$/g, "");

        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase.storage.from(bucket).list(prefix, {
            limit: 1000,
            offset: 0,
            sortBy: { column: "name", order: "asc" },
        });
        if (error) return apiError(error.message, 500);

        const entries = (data ?? []) as StorageEntry[];
        const folders: { name: string; path: string }[] = [];
        const files: {
            name: string;
            path: string;
            publicUrl: string;
            size: number;
            mimetype: string;
            createdAt: string | null;
            updatedAt: string | null;
        }[] = [];

        for (const entry of entries) {
            // Supabase returns folder placeholder rows with id === null and metadata === null.
            const isFolder = entry.id === null && entry.metadata === null;
            const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;

            if (isFolder) {
                folders.push({ name: entry.name, path: fullPath });
            } else if (entry.name === ".keep") {
                continue;
            } else {
                const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fullPath);
                files.push({
                    name: entry.name,
                    path: fullPath,
                    publicUrl: pub.publicUrl,
                    size: entry.metadata?.size ?? 0,
                    mimetype: entry.metadata?.mimetype ?? "application/octet-stream",
                    createdAt: entry.created_at,
                    updatedAt: entry.updated_at,
                });
            }
        }

        return apiSuccess({ bucket, prefix, folders, files });
    } catch (err) {
        return handleRouteError(err);
    }
}

// POST — upload a file (multipart/form-data) or create a folder (JSON).
// form: file (File), prefix? (string)
// json: { action: "create-folder", path: string }
export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
        const bucket = pickBucket(req);
        if (!bucket) return apiError("Invalid bucket", 400);

        const contentType = req.headers.get("content-type") ?? "";
        const supabase = createSupabaseAdminClient();

        if (contentType.includes("application/json")) {
            const body = await req.json().catch(() => ({}));
            if (body.action !== "create-folder" || typeof body.path !== "string") {
                return apiError("action=create-folder and path required", 400);
            }
            const folderPath = cleanPath(body.path);
            if (!folderPath) return apiError("path required", 400);
            const keepPath = `${folderPath}/.keep`;
            const { error } = await supabase.storage
                .from(bucket)
                .upload(keepPath, Buffer.from(""), { contentType: "text/plain", upsert: true });
            if (error) return apiError(error.message, 500);
            return apiSuccess({ path: folderPath });
        }

        const form = await req.formData();
        const file = form.get("file");
        const prefix = cleanPath((form.get("prefix") as string | null) ?? "");
        if (!(file instanceof File)) return apiError("file required", 400);

        const fileName = `${Date.now()}-${safeFileName(file.name)}`;
        const path = prefix ? `${prefix}/${fileName}` : fileName;

        const buffer = Buffer.from(await file.arrayBuffer());
        const { error } = await supabase.storage
            .from(bucket)
            .upload(path, buffer, { contentType: file.type, upsert: false });
        if (error) return apiError(error.message, 500);

        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        return apiSuccess({ name: fileName, path, publicUrl: pub.publicUrl });
    } catch (err) {
        return handleRouteError(err);
    }
}

// DELETE — remove a file or a folder. body: { path: string, type?: "file" | "folder" }
export async function DELETE(req: NextRequest) {
    try {
        await requireAdmin();
        const bucket = pickBucket(req);
        if (!bucket) return apiError("Invalid bucket", 400);

        const { path, type } = await req.json();
        if (!path || typeof path !== "string") return apiError("path required", 400);

        const supabase = createSupabaseAdminClient();
        const targets = type === "folder" ? await listFilesRecursive(supabase, bucket, path) : [cleanPath(path)];
        if (targets.length === 0) return apiSuccess({ path, removed: 0 });
        const { error } = await supabase.storage.from(bucket).remove(targets);
        if (error) return apiError(error.message, 500);

        return apiSuccess({ path, removed: targets.length });
    } catch (err) {
        return handleRouteError(err);
    }
}

// PATCH — rename a file or folder (copy + delete).
// body: { from: string, to: string, type?: "file" | "folder" }
export async function PATCH(req: NextRequest) {
    try {
        await requireAdmin();
        const bucket = pickBucket(req);
        if (!bucket) return apiError("Invalid bucket", 400);

        const { from, to, type } = await req.json();
        if (!from || !to) return apiError("from and to required", 400);

        const supabase = createSupabaseAdminClient();
        const cleanFrom = cleanPath(from);
        const cleanTo = cleanPath(to);

        if (type === "folder") {
            const targets = await listFilesRecursive(supabase, bucket, cleanFrom);
            for (const oldPath of targets) {
                const nextPath = `${cleanTo}/${oldPath.slice(cleanFrom.length).replace(/^\/+/, "")}`;
                const { error } = await supabase.storage.from(bucket).copy(oldPath, nextPath);
                if (error) return apiError(error.message, 500);
            }
            if (targets.length > 0) {
                const { error } = await supabase.storage.from(bucket).remove(targets);
                if (error) return apiError(error.message, 500);
            }
            return apiSuccess({ path: cleanTo, moved: targets.length });
        }

        const { error: copyErr } = await supabase.storage.from(bucket).copy(cleanFrom, cleanTo);
        if (copyErr) return apiError(copyErr.message, 500);
        const { error: removeErr } = await supabase.storage.from(bucket).remove([cleanFrom]);
        if (removeErr) return apiError(removeErr.message, 500);

        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(cleanTo);
        return apiSuccess({ path: cleanTo, publicUrl: pub.publicUrl });
    } catch (err) {
        return handleRouteError(err);
    }
}
