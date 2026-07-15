import type { SupabaseClient } from "@supabase/supabase-js";

export const POST_IMAGE_BUCKET = "post-images";
export const SUBMISSION_BUCKET = "submissions";

export const ALLOWED_IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
export const MAX_SUBMISSION_BYTES = 5 * 1024 * 1024;

function safeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function uploadPostImage(
    supabase: SupabaseClient,
    file: File,
): Promise<{ path: string; publicUrl: string }> {
    if (!ALLOWED_IMAGE_MIME.has(file.type)) {
        throw new Error("unsupported image type");
    }
    const path = `${Date.now()}_${safeName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
        .from(POST_IMAGE_BUCKET)
        .upload(path, buffer, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
}

export async function uploadSubmissionFile(
    supabase: SupabaseClient,
    args: { contestSlug: string; teamCode: string; file: File },
): Promise<{ path: string }> {
    const { contestSlug, teamCode, file } = args;
    if (file.size <= 0) throw new Error("empty file");
    if (file.size > MAX_SUBMISSION_BYTES) throw new Error("file exceeds 5MB");
    const path = `${safeName(contestSlug)}/${safeName(teamCode)}/${crypto.randomUUID()}_${safeName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
        .from(SUBMISSION_BUCKET)
        .upload(path, buffer, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    return { path };
}

export async function createSubmissionSignedUrl(
    supabase: SupabaseClient,
    storagePath: string,
    expiresInSeconds = 300,
): Promise<string> {
    const { data, error } = await supabase.storage
        .from(SUBMISSION_BUCKET)
        .createSignedUrl(storagePath, expiresInSeconds);
    if (error) throw new Error(error.message);
    return data.signedUrl;
}

export async function deleteSubmissionFile(
    supabase: SupabaseClient,
    storagePath: string,
): Promise<void> {
    const { error } = await supabase.storage.from(SUBMISSION_BUCKET).remove([storagePath]);
    if (error) throw new Error(error.message);
}
