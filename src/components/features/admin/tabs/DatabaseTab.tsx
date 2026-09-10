"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Table, Network } from "lucide-react";
import { useTranslations } from "next-intl";
import DataTable from "../common/DataTable";
import { Button } from "../common/Button";
import { useToast } from "../../../ui/Toast";
import DatabaseErDiagram from "../database/DatabaseErDiagram";

interface TableData {
    post: Record<string, unknown>[];
    category: Record<string, unknown>[];
    series: Record<string, unknown>[];
    tag: Record<string, unknown>[];
    post_tags: Record<string, unknown>[];
    site_settings: Record<string, unknown>[];
}

const EMPTY: TableData = { post: [], category: [], series: [], tag: [], post_tags: [], site_settings: [] };

export default function DatabaseTab() {
    const { showToast } = useToast();
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const [data, setData] = useState<TableData>(EMPTY);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"table" | "diagram">("table");

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
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-foreground">{t("database")}</h2>
                    <div className="flex items-center rounded-lg border border-(--border-color) bg-foreground/5 p-0.5 text-xs">
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                                viewMode === "table"
                                    ? "bg-background text-foreground font-semibold shadow-xs"
                                    : "text-foreground/60 hover:text-foreground"
                            }`}
                        >
                            <Table size={13} />
                            <span>Bảng dữ liệu</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("diagram")}
                            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                                viewMode === "diagram"
                                    ? "bg-background text-foreground font-semibold shadow-xs"
                                    : "text-foreground/60 hover:text-foreground"
                            }`}
                        >
                            <Network size={13} />
                            <span>Sơ đồ quan hệ ER</span>
                        </button>
                    </div>
                </div>
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

            {viewMode === "diagram" ? (
                <DatabaseErDiagram
                    counts={{
                        post: data.post.length,
                        category: data.category.length,
                        series: data.series.length,
                        tag: data.tag.length,
                        post_tags: data.post_tags.length,
                        site_settings: data.site_settings.length
                    }}
                />
            ) : (
                <div className="space-y-3">

            <DataTable
                title="post"
                isLoading={isLoading}
                data={data.post}
                columns={[
                    { key: "id", label: "ID" },
                    { key: "title", label: t("dbTitle") },
                    { key: "slug", label: "Slug" },
                    { key: "category", label: t("dbCategory") },
                    { key: "level", label: t("dbLevel") },
                    { key: "reading_time", label: t("dbReadingTime") },
                    { key: "series_id", label: t("dbSeriesId") },
                    { key: "series_order", label: t("dbSeriesOrder") },
                    { key: "published", label: t("dbPublished") },
                    { key: "published_at", label: t("dbPublishedAt") },
                    { key: "created_at", label: t("dbCreatedAt") },
                ]}
            />

            <DataTable
                title="category"
                isLoading={isLoading}
                data={data.category}
                columns={[
                    { key: "id", label: "ID" },
                    { key: "icon", label: t("categoryIcon") },
                    { key: "name", label: t("dbName") },
                    { key: "slug", label: "Slug" },
                    { key: "description", label: t("fieldDescription") },
                    { key: "examples", label: t("categoryExamples") },
                    { key: "display_order", label: t("categoryOrder") },
                    { key: "updated_at", label: t("dbUpdatedAt") },
                ]}
            />

            <DataTable
                title="series"
                isLoading={isLoading}
                data={data.series}
                columns={[
                    { key: "id", label: "ID" },
                    { key: "name", label: t("dbName") },
                    { key: "slug", label: "Slug" },
                    { key: "description", label: t("fieldDescription") },
                    { key: "created_at", label: t("dbCreatedAt") },
                    { key: "updated_at", label: t("dbUpdatedAt") },
                ]}
            />

            <DataTable
                title="tag"
                isLoading={isLoading}
                data={data.tag}
                columns={[
                    { key: "id", label: "ID" },
                    { key: "name", label: t("dbName") },
                    { key: "slug", label: "Slug" },
                    { key: "created_at", label: t("dbCreatedAt") },
                ]}
            />

            <DataTable
                title="post_tags"
                isLoading={isLoading}
                data={data.post_tags}
                columns={[
                    { key: "post_id", label: t("dbPostId") },
                    { key: "tag_id", label: t("dbTagId") },
                ]}
            />

            <DataTable
                title="site_settings"
                isLoading={isLoading}
                data={data.site_settings}
                columns={[
                    { key: "key", label: t("dbKey") },
                    { key: "value", label: t("dbValue") },
                    { key: "is_public", label: t("dbPublic") },
                    { key: "updated_at", label: t("dbUpdatedAt") },
                ]}
            />
                </div>
            )}
        </div>
    );
}
