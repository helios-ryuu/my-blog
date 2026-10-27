import { CHAR_LIMITS, type AdminCategory, type AdminTag } from "@/types/admin";
import { POST_LEVELS, type PostCategory, type PostLevel } from "@/types/database";

export function slugifyText(input: string): string {
    const base = input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    return base || "untitled-post";
}

export interface ParsedMdxDraft {
    title: string;
    slug: string;
    description: string;
    content: string;
    image_url: string;
    category: PostCategory;
    level: PostLevel;
    reading_time: number;
    tag_ids: number[];
    matchedTagNames: string[];
    unmatchedTagNames: string[];
    hasFrontmatter: boolean;
}

interface ParseMdxOptions {
    categories?: AdminCategory[];
    tags?: AdminTag[];
    existingSlugs?: string[];
    existingTitles?: string[];
}

function unquoteYamlScalar(raw: string): string {
    const trimmed = raw.trim();
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'").trim();
    }
    return trimmed;
}

function parseSimpleFrontmatter(raw: string): {
    frontmatter: Record<string, string | string[]>;
    body: string;
    hasFrontmatter: boolean;
} {
    const normalized = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
    const match = normalized.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)([\s\S]*)$/);
    if (!match) {
        return { frontmatter: {}, body: normalized.trim(), hasFrontmatter: false };
    }

    const yamlBlock = match[1];
    const body = match[2].trim();
    const frontmatter: Record<string, string | string[]> = {};
    const lines = yamlBlock.split("\n");

    let currentListKey: string | null = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        if (currentListKey && trimmed.startsWith("- ")) {
            const itemVal = unquoteYamlScalar(trimmed.slice(2));
            const existing = frontmatter[currentListKey];
            if (Array.isArray(existing)) {
                if (itemVal) existing.push(itemVal);
            }
            continue;
        }

        const colonIdx = line.indexOf(":");
        if (colonIdx <= 0) {
            currentListKey = null;
            continue;
        }

        const key = line.slice(0, colonIdx).trim().toLowerCase();
        const rest = line.slice(colonIdx + 1).trim();

        if (!rest) {
            currentListKey = key;
            frontmatter[key] = [];
            continue;
        }

        currentListKey = null;

        if (rest.startsWith("[") && rest.endsWith("]")) {
            const inner = rest.slice(1, -1).trim();
            frontmatter[key] = inner
                ? inner.split(",").map((part) => unquoteYamlScalar(part)).filter(Boolean)
                : [];
        } else {
            frontmatter[key] = unquoteYamlScalar(rest);
        }
    }

    return { frontmatter, body, hasFrontmatter: true };
}

function extractFirstHeading(markdown: string): string | null {
    const match = markdown.match(/^#{1,3}\s+(.+)$/m);
    if (!match) return null;
    return match[1]
        .replace(/[*_`~[\]()]/g, "")
        .trim();
}

function extractFirstParagraph(markdown: string): string | null {
    const lines = markdown.split("\n");
    const paragraphLines: string[] = [];
    let inCodeFence = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.startsWith("```") || line.startsWith("~~~")) {
            inCodeFence = !inCodeFence;
            continue;
        }
        if (inCodeFence) continue;
        if (!line) {
            if (paragraphLines.length > 0) break;
            continue;
        }
        if (
            line.startsWith("#") ||
            line.startsWith(">") ||
            line.startsWith("- ") ||
            line.startsWith("* ") ||
            /^\d+\.\s/.test(line) ||
            line.startsWith("|") ||
            line.startsWith("![") ||
            line.startsWith("<") ||
            line === "---"
        ) {
            if (paragraphLines.length > 0) break;
            continue;
        }
        paragraphLines.push(line);
    }

    if (paragraphLines.length === 0) return null;
    const text = paragraphLines
        .join(" ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`~]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    return text || null;
}

function ensureUniqueSlug(baseSlug: string, existingSlugs: string[] = []): string {
    const cleanBase = slugifyText(baseSlug).slice(0, CHAR_LIMITS.slug).replace(/-+$/g, "");
    const slugSet = new Set(existingSlugs.map((s) => s.toLowerCase()));
    if (!slugSet.has(cleanBase)) return cleanBase;

    const draftCandidate = `${cleanBase}-draft`;
    if (!slugSet.has(draftCandidate)) return draftCandidate;

    let counter = 2;
    while (slugSet.has(`${cleanBase}-${counter}`)) {
        counter += 1;
    }
    return `${cleanBase}-${counter}`;
}

function ensureUniqueTitle(baseTitle: string, existingTitles: string[] = []): string {
    const trimmed = baseTitle.trim().slice(0, CHAR_LIMITS.title);
    const titleSet = new Set(existingTitles.map((t) => t.toLowerCase()));
    if (!titleSet.has(trimmed.toLowerCase())) return trimmed;

    const draftCandidate = `${trimmed} (Draft)`.slice(0, CHAR_LIMITS.title);
    if (!titleSet.has(draftCandidate.toLowerCase())) return draftCandidate;

    let counter = 2;
    while (titleSet.has(`${trimmed} (${counter})`.toLowerCase())) {
        counter += 1;
    }
    return `${trimmed} (${counter})`.slice(0, CHAR_LIMITS.title);
}

export function parseMdxFileContent(
    rawContent: string,
    fileName: string,
    opts: ParseMdxOptions = {},
): ParsedMdxDraft {
    const { frontmatter, body, hasFrontmatter } = parseSimpleFrontmatter(rawContent);

    const fileBaseName = fileName
        .replace(/\.(mdx|md)$/i, "")
        .replace(/[-_]+/g, " ")
        .trim();

    const fmTitle = typeof frontmatter.title === "string" ? frontmatter.title.trim() : "";
    const headingTitle = extractFirstHeading(body);
    const rawTitle = fmTitle || headingTitle || fileBaseName || "Bài viết nháp mới";
    const title = ensureUniqueTitle(rawTitle, opts.existingTitles);

    const fmSlug = typeof frontmatter.slug === "string" ? frontmatter.slug.trim() : "";
    const slug = ensureUniqueSlug(fmSlug || title, opts.existingSlugs);

    const fmDescription = typeof frontmatter.description === "string" ? frontmatter.description.trim() : "";
    const firstParagraph = extractFirstParagraph(body);
    const rawDescription = fmDescription || firstParagraph || `Bản nháp bài viết: ${title}`;
    const description = rawDescription.slice(0, CHAR_LIMITS.description);

    // Strip leading H1 if it matches title to follow blog convention (start with H2)
    let normalizedContent = body.replace(/^#\s+.+\n+/, "").trim();
    if (!normalizedContent) {
        normalizedContent = `## ${title}\n\n${description}`;
    }
    const content = normalizedContent.slice(0, CHAR_LIMITS.content);

    // Category resolution
    const fmCategory = typeof frontmatter.category === "string" ? frontmatter.category.trim().toLowerCase() : "";
    const validCategories = opts.categories ?? [];
    const matchedCategory = validCategories.find(
        (c) => c.slug.toLowerCase() === fmCategory || c.name.toLowerCase() === fmCategory,
    );
    const category: PostCategory = matchedCategory
        ? matchedCategory.slug
        : validCategories.some((c) => c.slug === "articles") || validCategories.length === 0
            ? "articles"
            : validCategories[0].slug;

    // Level resolution
    const fmLevel = typeof frontmatter.level === "string" ? frontmatter.level.trim().toLowerCase() : "";
    const level: PostLevel = POST_LEVELS.includes(fmLevel as PostLevel)
        ? (fmLevel as PostLevel)
        : "beginner";

    // Reading time resolution
    const fmReadingTimeRaw = typeof frontmatter.reading_time === "string"
        ? Number.parseInt(frontmatter.reading_time, 10)
        : typeof frontmatter.readingtime === "string"
            ? Number.parseInt(frontmatter.readingtime, 10)
            : NaN;
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const estimatedMinutes = Math.max(1, Math.min(120, Math.ceil(wordCount / 200)));
    const reading_time = Number.isSafeInteger(fmReadingTimeRaw) && fmReadingTimeRaw >= 1 && fmReadingTimeRaw <= 120
        ? fmReadingTimeRaw
        : estimatedMinutes;

    // Image URL resolution
    const fmImage = typeof frontmatter.image_url === "string"
        ? frontmatter.image_url.trim()
        : typeof frontmatter.image === "string"
            ? frontmatter.image.trim()
            : "";

    // Tags resolution
    const rawTags = frontmatter.tags;
    const tagTokens: string[] = Array.isArray(rawTags)
        ? rawTags
        : typeof rawTags === "string" && rawTags.trim()
            ? rawTags.split(",").map((item) => item.trim()).filter(Boolean)
            : [];

    const availableTags = opts.tags ?? [];
    const tag_ids: number[] = [];
    const matchedTagNames: string[] = [];
    const unmatchedTagNames: string[] = [];

    for (const token of tagTokens) {
        const lower = token.toLowerCase().replace(/^#/, "");
        const matched = availableTags.find(
            (t) => t.name.toLowerCase() === lower || (t.slug && t.slug.toLowerCase() === lower),
        );
        if (matched) {
            if (!tag_ids.includes(matched.id) && tag_ids.length < 5) {
                tag_ids.push(matched.id);
                matchedTagNames.push(matched.name);
            }
        } else if (token.trim()) {
            unmatchedTagNames.push(token.trim());
        }
    }

    return {
        title,
        slug,
        description,
        content,
        image_url: fmImage,
        category,
        level,
        reading_time,
        tag_ids,
        matchedTagNames,
        unmatchedTagNames,
        hasFrontmatter,
    };
}

function generateMdxTemplate(): string {
    return `---
title: "Tiêu đề bài viết của bạn"
slug: "tieu-de-bai-viet-cua-ban"
description: "Mô tả ngắn gọn nội dung chính của bài viết (tối đa 300 ký tự)."
category: "articles"
level: "beginner"
reading_time: 5
image_url: ""
tags: ["nextjs", "devops"]
---

## Bối cảnh & Mục tiêu

Viết đoạn mở đầu giới thiệu chủ đề của bài viết. Bạn có thể sử dụng **in đậm**, *in nghiêng*, ~~gạch ngang~~ và \`inline code\`.

> [!NOTE]
> Bạn có thể dùng 5 loại hộp thông báo (Alert): \`[!NOTE]\`, \`[!TIP]\`, \`[!IMPORTANT]\`, \`[!WARNING]\`, \`[!CAUTION]\`.

## Hướng dẫn chi tiết

Danh sách các bước thực hiện:

- Chuẩn bị môi trường làm việc
- Cấu hình thông số hệ thống
- Kiểm tra và vận hành thử nghiệm

\`\`\`bash
# Ví dụ khối lệnh Bash có tô màu cú pháp Shiki
pnpm install
pnpm check
\`\`\`

### Bảng thông số tham khảo

| Thành phần | Vai trò | Trạng thái |
| --- | --- | :---: |
| Next.js 16 | App Router & SSR | Sẵn sàng |
| Supabase | PostgreSQL Database | Sẵn sàng |
| Cloudflare R2 | Object Storage CDN | Sẵn sàng |

## Đa phương tiện (Hình ảnh & Video)

Để chèn ảnh từ Cloudflare R2:

\`\`\`md
![Mô tả hình ảnh](/api/media/posts/example.webp)
\`\`\`

Để nhúng video YouTube:

\`\`\`mdx
<YouTube id="dQw4w9WgXcQ" title="Video minh họa" />
\`\`\`

## Tổng kết

Tóm tắt lại những điểm quan trọng nhất và tài liệu tham khảo tiếp theo.
`;
}

export function downloadMdxTemplate(filename = "post-template.mdx"): void {
    const content = generateMdxTemplate();
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

