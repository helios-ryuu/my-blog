import { HttpError } from "@/lib/api-helpers";
import type { PostInput } from "@/lib/posts-db";
import {
    POST_LEVELS,
    type PostLevel,
} from "@/types/database";
import type { CategoryInput } from "@/lib/categories-db";
import type { SeriesInput } from "@/lib/series-db";
import { CHAR_LIMITS } from "@/types/admin";

const POST_LEVEL_SET = new Set<PostLevel>(POST_LEVELS);
const POST_KEYS = new Set(["slug", "title", "description", "content", "image_url", "category", "level", "reading_time", "series_id", "series_order", "published", "tag_ids"]);
const TAG_KEYS = new Set(["name", "slug"]);
const CATEGORY_KEYS = new Set(["name", "slug", "icon", "description", "examples"]);
const SERIES_KEYS = new Set(["name", "slug", "description"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function objectInput(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new HttpError(400, "Request body must be a JSON object");
    }
    return value as Record<string, unknown>;
}

function rejectUnknownKeys(input: Record<string, unknown>, allowed: Set<string>) {
    const unknown = Object.keys(input).filter((key) => !allowed.has(key));
    if (unknown.length > 0) throw new HttpError(400, `Unsupported field: ${unknown[0]}`);
}

function textValue(value: unknown, field: string, max: number): string {
    if (typeof value !== "string") throw new HttpError(400, `${field} must be a string`);
    const normalized = field === "content" ? value : value.trim();
    if (!normalized.trim()) throw new HttpError(400, `${field} is required`);
    if (normalized.length > max) throw new HttpError(400, `${field} must be ${max} characters or fewer`);
    return normalized;
}

function slugValue(value: unknown): string {
    const slug = textValue(value, "slug", 200);
    if (!SLUG_PATTERN.test(slug)) {
        throw new HttpError(400, "slug must contain lowercase letters and digits separated by single hyphens");
    }
    return slug;
}

function imageValue(value: unknown): string | null {
    if (value === null || value === "") return null;
    if (typeof value !== "string") throw new HttpError(400, "image_url must be a string or null");
    const imageUrl = value.trim();
    if (imageUrl.length > 2048) throw new HttpError(400, "image_url must be 2048 characters or fewer");
    if (!imageUrl.startsWith("/") && !/^https?:\/\//i.test(imageUrl)) {
        throw new HttpError(400, "image_url must be an absolute HTTP URL or a site-relative path");
    }
    return imageUrl;
}

function optionalTextValue(value: unknown, field: string, max: number): string {
    if (typeof value !== "string") throw new HttpError(400, `${field} must be a string`);
    const normalized = value.trim();
    if (normalized.length > max) throw new HttpError(400, `${field} must be ${max} characters or fewer`);
    return normalized;
}

function tagIdsValue(value: unknown): number[] {
    if (!Array.isArray(value)) throw new HttpError(400, "tag_ids must be an array");
    const tagIds = [...new Set(value)];
    if (tagIds.length > 5) throw new HttpError(400, "A post can have at most 5 tags");
    if (!tagIds.every((id) => Number.isSafeInteger(id) && Number(id) > 0)) {
        throw new HttpError(400, "tag_ids must contain positive integers");
    }
    return tagIds as number[];
}

function readingTimeValue(value: unknown): number {
    if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > 120) {
        throw new HttpError(400, "reading_time must be an integer between 1 and 120");
    }
    return Number(value);
}

function nullablePositiveInteger(value: unknown, field: string): number | null {
    if (value === null) return null;
    if (!Number.isSafeInteger(value) || Number(value) < 1) {
        throw new HttpError(400, `${field} must be a positive integer or null`);
    }
    return Number(value);
}

function parsePostInput(value: unknown, partial: boolean): Partial<PostInput> {
    const input = objectInput(value);
    rejectUnknownKeys(input, POST_KEYS);
    if (partial && Object.keys(input).length === 0) throw new HttpError(400, "At least one post field is required");

    const parsed: Partial<PostInput> = {};
    if ("slug" in input) parsed.slug = slugValue(input.slug);
    if ("title" in input) parsed.title = textValue(input.title, "title", CHAR_LIMITS.title);
    if ("description" in input) parsed.description = textValue(input.description, "description", CHAR_LIMITS.description);
    if ("content" in input) parsed.content = textValue(input.content, "content", CHAR_LIMITS.content);
    if ("image_url" in input) parsed.image_url = imageValue(input.image_url);
    if ("category" in input) {
        const category = slugValue(input.category);
        if (category.length > 100) throw new HttpError(400, "category must be 100 characters or fewer");
        parsed.category = category;
    }
    if ("level" in input) {
        if (!POST_LEVEL_SET.has(input.level as PostLevel)) throw new HttpError(400, "Invalid post level");
        parsed.level = input.level as PostLevel;
    }
    if ("reading_time" in input) parsed.reading_time = readingTimeValue(input.reading_time);
    if ("series_id" in input) parsed.series_id = nullablePositiveInteger(input.series_id, "series_id");
    if ("series_order" in input) parsed.series_order = nullablePositiveInteger(input.series_order, "series_order");
    if ("published" in input) {
        if (typeof input.published !== "boolean") throw new HttpError(400, "published must be a boolean");
        parsed.published = input.published;
    }
    if ("tag_ids" in input) parsed.tag_ids = tagIdsValue(input.tag_ids);

    if (!partial) {
        for (const field of ["slug", "title", "description", "content", "category", "level", "reading_time"] as const) {
            if (!(field in parsed)) throw new HttpError(400, `${field} is required`);
        }
        parsed.series_id ??= null;
        parsed.series_order ??= null;
        if ((parsed.series_id === null) !== (parsed.series_order === null)) {
            throw new HttpError(400, "series_id and series_order must both be set or both be null");
        }
    }
    return parsed;
}

export function parsePostCreateInput(value: unknown): PostInput {
    return parsePostInput(value, false) as PostInput;
}

export function parsePostPatchInput(value: unknown): Partial<PostInput> {
    return parsePostInput(value, true);
}

function parseTagInput(value: unknown, partial: boolean): { name?: string; slug?: string } {
    const input = objectInput(value);
    rejectUnknownKeys(input, TAG_KEYS);
    if (partial && Object.keys(input).length === 0) throw new HttpError(400, "At least one tag field is required");

    const parsed: { name?: string; slug?: string } = {};
    if ("name" in input) parsed.name = textValue(input.name, "name", 80);
    if ("slug" in input) {
        const slug = slugValue(input.slug);
        if (slug.length > 100) throw new HttpError(400, "slug must be 100 characters or fewer");
        parsed.slug = slug;
    }
    if (!partial && (!parsed.name || !parsed.slug)) throw new HttpError(400, "name and slug are required");
    return parsed;
}

export function parseTagCreateInput(value: unknown): { name: string; slug: string } {
    return parseTagInput(value, false) as { name: string; slug: string };
}

export function parseTagPatchInput(value: unknown): { name?: string; slug?: string } {
    return parseTagInput(value, true);
}

function parseCategoryInput(value: unknown, partial: boolean): Partial<CategoryInput> {
    const input = objectInput(value);
    rejectUnknownKeys(input, CATEGORY_KEYS);
    if (partial && Object.keys(input).length === 0) throw new HttpError(400, "At least one category field is required");

    const parsed: Partial<CategoryInput> = {};
    if ("name" in input) parsed.name = textValue(input.name, "name", 80);
    if ("slug" in input) {
        const slug = slugValue(input.slug);
        if (slug.length > 100) throw new HttpError(400, "slug must be 100 characters or fewer");
        parsed.slug = slug;
    }
    if ("icon" in input) {
        parsed.icon = input.icon === null || (typeof input.icon === "string" && !input.icon.trim())
            ? null
            : textValue(input.icon, "icon", 16);
    }
    if ("description" in input) parsed.description = textValue(input.description, "description", 300);
    if ("examples" in input) parsed.examples = optionalTextValue(input.examples, "examples", 500);

    if (!partial) {
        for (const field of ["name", "slug", "description"] as const) {
            if (!(field in parsed)) throw new HttpError(400, `${field} is required`);
        }
        parsed.icon ??= null;
        parsed.examples ??= "";
    }
    return parsed;
}

export function parseCategoryCreateInput(value: unknown): CategoryInput {
    return parseCategoryInput(value, false) as CategoryInput;
}

export function parseCategoryPatchInput(value: unknown): Partial<CategoryInput> {
    return parseCategoryInput(value, true);
}

function parseSeriesInput(value: unknown, partial: boolean): Partial<SeriesInput> {
    const input = objectInput(value);
    rejectUnknownKeys(input, SERIES_KEYS);
    if (partial && Object.keys(input).length === 0) throw new HttpError(400, "At least one series field is required");

    const parsed: Partial<SeriesInput> = {};
    if ("name" in input) parsed.name = textValue(input.name, "name", 100);
    if ("slug" in input) {
        const slug = slugValue(input.slug);
        if (slug.length > 100) throw new HttpError(400, "slug must be 100 characters or fewer");
        parsed.slug = slug;
    }
    if ("description" in input) {
        const description = optionalTextValue(input.description, "description", 500);
        parsed.description = description || null;
    }
    if (!partial && (!parsed.name || !parsed.slug)) throw new HttpError(400, "name and slug are required");
    return parsed;
}

export function parseSeriesCreateInput(value: unknown): SeriesInput {
    return parseSeriesInput(value, false) as SeriesInput;
}

export function parseSeriesPatchInput(value: unknown): Partial<SeriesInput> {
    return parseSeriesInput(value, true);
}
