import {
    CopyObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    S3Client,
    type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";

export const MEDIA_BUCKET_NAME = process.env.R2_BUCKET_NAME?.trim() || "my-blog";
const MAX_MEDIA_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set([
    "image/avif",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
]);

export interface MediaEntry {
    name: string;
    path: string;
    publicUrl: string;
    size: number;
    mimetype: string;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface MediaFolder {
    name: string;
    path: string;
    size?: number;
    fileCount?: number;
}

let cachedClient: S3Client | null = null;

function requiredEnv(name: "R2_ENDPOINT" | "R2_ACCESS_KEY_ID" | "R2_SECRET_ACCESS_KEY"): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} is required for Cloudflare R2`);
    return value;
}

function normalizeEndpoint(endpoint: string): string {
    const url = new URL(endpoint);
    const bucketSuffix = `/${MEDIA_BUCKET_NAME}`;
    if (url.pathname.replace(/\/$/, "") === bucketSuffix) url.pathname = "/";
    return url.toString().replace(/\/$/, "");
}

function getR2Client(): S3Client {
    if (cachedClient) return cachedClient;
    cachedClient = new S3Client({
        region: "auto",
        endpoint: normalizeEndpoint(requiredEnv("R2_ENDPOINT")),
        credentials: {
            accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
            secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
        },
    });
    return cachedClient;
}

export function cleanStoragePath(path: string): string {
    const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
    if (parts.some((part) => part === "." || part === "..")) {
        throw new Error("Invalid storage path");
    }
    return parts.join("/");
}

function encodeStoragePath(path: string): string {
    return cleanStoragePath(path).split("/").map(encodeURIComponent).join("/");
}

export function getMediaUrl(path: string): string {
    const encodedPath = encodeStoragePath(path);
    const publicBaseUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "");
    return publicBaseUrl ? `${publicBaseUrl}/${encodedPath}` : `/api/media/${encodedPath}`;
}

function safeFileName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "") || "image";
}

function inferMimeType(path: string): string {
    const extension = path.split(".").pop()?.toLowerCase();
    const types: Record<string, string> = {
        avif: "image/avif",
        gif: "image/gif",
        jpeg: "image/jpeg",
        jpg: "image/jpeg",
        png: "image/png",
        svg: "image/svg+xml",
        webp: "image/webp",
    };
    return (extension && types[extension]) || "application/octet-stream";
}

export async function listMedia(prefix = ""): Promise<{
    folders: MediaFolder[];
    files: MediaEntry[];
    totalSize: number;
    totalFiles: number;
}> {
    const cleanPrefix = cleanStoragePath(prefix);
    const objectPrefix = cleanPrefix ? `${cleanPrefix}/` : "";
    const folderMap = new Map<string, { name: string; path: string; size: number; fileCount: number }>();
    const files: MediaEntry[] = [];
    let totalSize = 0;
    let totalFiles = 0;
    let continuationToken: string | undefined;

    do {
        const result = await getR2Client().send(new ListObjectsV2Command({
            Bucket: MEDIA_BUCKET_NAME,
            Prefix: objectPrefix,
            ContinuationToken: continuationToken,
        }));

        for (const item of result.Contents ?? []) {
            const key = item.Key;
            if (!key || key === objectPrefix) continue;

            const isDirMarker = key.endsWith("/");
            const isKeepFile = key.endsWith("/.keep") || key === ".keep";
            const relative = key.slice(objectPrefix.length);
            if (!relative || relative === "/") continue;

            const slashIndex = relative.indexOf("/");

            if (slashIndex === -1) {
                // Direct file in current directory
                if (isDirMarker || isKeepFile) continue;
                const updatedAt = item.LastModified?.toISOString() ?? null;
                const size = item.Size ?? 0;
                files.push({
                    name: relative,
                    path: key,
                    publicUrl: getMediaUrl(key),
                    size,
                    mimetype: inferMimeType(key),
                    createdAt: updatedAt,
                    updatedAt,
                });
                totalSize += size;
                totalFiles += 1;
            } else {
                // Inside an immediate subfolder
                const folderName = relative.slice(0, slashIndex);
                const folderPath = objectPrefix ? `${objectPrefix}${folderName}` : folderName;

                if (!folderMap.has(folderName)) {
                    folderMap.set(folderName, {
                        name: folderName,
                        path: folderPath,
                        size: 0,
                        fileCount: 0,
                    });
                }

                if (!isKeepFile && !isDirMarker) {
                    const current = folderMap.get(folderName)!;
                    const size = item.Size ?? 0;
                    current.size += size;
                    current.fileCount += 1;
                    totalSize += size;
                    totalFiles += 1;
                }
            }
        }

        continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (continuationToken);

    return {
        folders: Array.from(folderMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
        files: files.sort((a, b) => a.name.localeCompare(b.name)),
        totalSize,
        totalFiles,
    };
}

export async function listMediaKeys(prefix: string): Promise<string[]> {
    const cleanPrefix = cleanStoragePath(prefix);
    const objectPrefix = cleanPrefix ? `${cleanPrefix}/` : "";
    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
        const result = await getR2Client().send(new ListObjectsV2Command({
            Bucket: MEDIA_BUCKET_NAME,
            Prefix: objectPrefix,
            ContinuationToken: continuationToken,
        }));
        for (const item of result.Contents ?? []) {
            if (item.Key) keys.push(item.Key);
        }
        continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (continuationToken);

    return keys;
}

export async function createMediaFolder(path: string): Promise<string> {
    const cleanPath = cleanStoragePath(path);
    if (!cleanPath) throw new Error("Folder path is required");
    await getR2Client().send(new PutObjectCommand({
        Bucket: MEDIA_BUCKET_NAME,
        Key: `${cleanPath}/.keep`,
        Body: new Uint8Array(0),
        ContentLength: 0,
        ContentType: "text/plain",
    }));
    return cleanPath;
}

export async function uploadMediaFile(file: File, prefix = ""): Promise<MediaEntry> {
    if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
        throw new Error("Only AVIF, GIF, JPEG, PNG, and WebP images are supported");
    }
    if (file.size > MAX_MEDIA_FILE_BYTES) throw new Error("Image must be 10 MB or smaller");

    const cleanPrefix = cleanStoragePath(prefix);
    const name = `${Date.now()}-${safeFileName(file.name)}`;
    const path = cleanPrefix ? `${cleanPrefix}/${name}` : name;
    await getR2Client().send(new PutObjectCommand({
        Bucket: MEDIA_BUCKET_NAME,
        Key: path,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type || inferMimeType(path),
        CacheControl: "public, max-age=31536000, immutable",
    }));

    const now = new Date().toISOString();
    return {
        name,
        path,
        publicUrl: getMediaUrl(path),
        size: file.size,
        mimetype: file.type || inferMimeType(path),
        createdAt: now,
        updatedAt: now,
    };
}

export async function deleteMediaObjects(paths: string[]): Promise<void> {
    const keys = paths.map(cleanStoragePath).filter(Boolean);
    for (let index = 0; index < keys.length; index += 1000) {
        const result = await getR2Client().send(new DeleteObjectsCommand({
            Bucket: MEDIA_BUCKET_NAME,
            Delete: { Objects: keys.slice(index, index + 1000).map((Key) => ({ Key })) },
        }));
        if (result.Errors?.length) {
            throw new Error(result.Errors.map((error) => error.Message || error.Code).join(", "));
        }
    }
}

async function copyMediaObject(from: string, to: string): Promise<void> {
    const source = cleanStoragePath(from);
    const destination = cleanStoragePath(to);
    await getR2Client().send(new CopyObjectCommand({
        Bucket: MEDIA_BUCKET_NAME,
        CopySource: `${encodeURIComponent(MEDIA_BUCKET_NAME)}/${encodeStoragePath(source)}`,
        Key: destination,
    }));
}

export async function moveMediaObject(from: string, to: string): Promise<string> {
    const source = cleanStoragePath(from);
    const destination = cleanStoragePath(to);
    if (!source || !destination) throw new Error("Source and destination are required");
    await copyMediaObject(source, destination);
    await deleteMediaObjects([source]);
    return destination;
}

export async function moveMediaFolder(from: string, to: string): Promise<number> {
    const source = cleanStoragePath(from);
    const destination = cleanStoragePath(to);
    if (!source || !destination) throw new Error("Source and destination are required");
    const keys = await listMediaKeys(source);
    for (const key of keys) {
        await copyMediaObject(key, `${destination}/${key.slice(source.length).replace(/^\/+/, "")}`);
    }
    await deleteMediaObjects(keys);
    return keys.length;
}

export async function getMediaObject(path: string): Promise<GetObjectCommandOutput> {
    const key = cleanStoragePath(path);
    if (!key) throw new Error("Media path is required");
    return getR2Client().send(new GetObjectCommand({ Bucket: MEDIA_BUCKET_NAME, Key: key }));
}
