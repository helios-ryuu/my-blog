"use client";

import DataTable from "../common/DataTable";
import type { AdminPost, AdminTag } from "@/types/admin";

interface PreviewSectionProps {
    posts: AdminPost[];
    tags: AdminTag[];
    isLoading?: boolean;
}

export default function PreviewSection({ posts, tags, isLoading }: PreviewSectionProps) {
    const postRows = posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        published: p.published,
        created_at: p.created_at,
    }));

    const tagRows = tags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug ?? "",
        created_at: t.created_at,
    }));

    return (
        <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">
                Database
            </h3>
            <DataTable
                title="Posts"
                isLoading={isLoading}
                data={postRows}
                columns={[
                    { key: "id", label: "ID" },
                    { key: "title", label: "Title" },
                    { key: "slug", label: "Slug" },
                    { key: "category", label: "Category" },
                    { key: "published", label: "Published" },
                    { key: "created_at", label: "Created" },
                ]}
            />
            <DataTable
                title="Tags"
                isLoading={isLoading}
                data={tagRows}
                columns={[
                    { key: "id", label: "ID" },
                    { key: "name", label: "Name" },
                    { key: "slug", label: "Slug" },
                    { key: "created_at", label: "Created" },
                ]}
            />
        </section>
    );
}
