"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import DataTable from "../common/DataTable";
import { Button } from "../common/Button";
import { useToast } from "../../../ui/Toast";

interface TableData {
    users: Record<string, unknown>[];
    post: Record<string, unknown>[];
    tag: Record<string, unknown>[];
    post_tags: Record<string, unknown>[];
}

const EMPTY: TableData = { users: [], post: [], tag: [], post_tags: [] };

export default function DatabaseTab() {
    const { showToast } = useToast();
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const [data, setData] = useState<TableData>(EMPTY);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/data");
            const json = await res.json();
            if (json.success) setData(json.data);
            else showToast("error", json.message || t("loadError"));
        } catch (e) {
            showToast("error", e instanceof Error ? e.message : t("loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [showToast, t]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{t("database")}</h2>
                <Button
                    variant="utility"
                    size="sm"
                    onClick={fetchData}
                    disabled={isLoading}
                    isLoading={isLoading}
                    loadingText={tCommon("loading")}
                    icon={<RefreshCw size={14} />}
                >
                    {tCommon("refresh")}
                </Button>
            </div>

            <DataTable
                title="Users"
                isLoading={isLoading}
                data={data.users}
                columns={[
                    { key: "id", label: "ID" },
                    { key: "username", label: "Username" },
                    { key: "full_name", label: "Full name" },
                    { key: "email", label: "Email" },
                    { key: "phone", label: "Phone" },
                    { key: "role", label: "Role" },
                    { key: "school", label: "School" },
                    { key: "created_at", label: "Created at" },
                ]}
            />

            <DataTable
                title="Posts"
                isLoading={isLoading}
                data={data.post}
                columns={[
                    { key: "id", label: "ID" },
                    { key: "title", label: "Title" },
                    { key: "slug", label: "Slug" },
                    { key: "category", label: "Category" },
                    { key: "published", label: "Published" },
                    { key: "published_at", label: "Published at" },
                    { key: "created_at", label: "Created at" },
                ]}
            />

            <DataTable
                title="Tags"
                isLoading={isLoading}
                data={data.tag}
                columns={[
                    { key: "id", label: "ID" },
                    { key: "name", label: "Name" },
                    { key: "slug", label: "Slug" },
                    { key: "created_at", label: "Created at" },
                ]}
            />

            <DataTable
                title="Post ↔ Tags"
                isLoading={isLoading}
                data={data.post_tags}
                columns={[
                    { key: "post_id", label: "Post ID" },
                    { key: "tag_id", label: "Tag ID" },
                ]}
            />
        </div>
    );
}
