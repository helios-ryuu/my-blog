"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import ManagementTab from "@/components/features/admin/tabs/ManagementTab";
import AddTagForm from "@/components/features/admin/forms/AddTagForm";
import DeletePreviewPopup from "@/components/features/admin/common/DeletePreviewPopup";
import EditTagForm from "@/components/features/admin/forms/EditTagForm";
import SiteSettingsSection from "@/components/features/admin/sections/SiteSettingsSection";
import SeriesForm from "@/components/features/admin/forms/SeriesForm";
import { startNavigationLoading } from "@/lib/navigation-loading";
import type { DeleteConfirmData } from "@/components/features/admin/sections/DeleteSection";
import type { AdminCategory, AdminPost, AdminSeries, AdminTag } from "@/types/admin";

function AdminWorkspace() {
    const router = useRouter();
    const { showToast } = useToast();
    const t = useTranslations("admin");
    const tDelete = useTranslations("deletePopup");
    const [posts, setPosts] = useState<AdminPost[]>([]);
    const [tags, setTags] = useState<AdminTag[]>([]);
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showAddTag, setShowAddTag] = useState(false);
    const [editTag, setEditTag] = useState<AdminTag | null>(null);
    const [showAddSeries, setShowAddSeries] = useState(false);
    const [editSeries, setEditSeries] = useState<AdminSeries | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteConfirmData | null>(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const [postsRes, tagsRes, categoriesRes] = await Promise.all([
                fetch("/api/admin/posts?pageSize=50"),
                fetch("/api/admin/tags"),
                fetch("/api/admin/categories"),
            ]);
            const postsJson = await postsRes.json();
            const tagsJson = await tagsRes.json();
            const categoriesJson = await categoriesRes.json();
            if (postsJson.success) setPosts(postsJson.data.items ?? []);
            if (tagsJson.success) setTags(tagsJson.data ?? []);
            if (categoriesJson.success) setCategories(categoriesJson.data ?? []);
        } catch (err) {
            showToast("error", err instanceof Error ? err.message : t("loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [showToast, t]);

    useEffect(() => { refresh(); }, [refresh]);

    async function confirmDelete() {
        if (!deleteTarget) return;
        const url = deleteTarget.type === "post"
            ? `/api/admin/posts/${deleteTarget.id}`
            : deleteTarget.type === "tag"
                ? `/api/admin/tags/${deleteTarget.id}`
                : `/api/admin/series/${deleteTarget.id}`;
        try {
            const res = await fetch(url, { method: "DELETE" });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || t("deleteError"));
            const typeLabel = deleteTarget.type === "post" ? tDelete("typePost") : deleteTarget.type === "tag" ? tDelete("typeTag") : tDelete("typeSeries");
            showToast("success", t("deleteSuccess", { type: typeLabel }));
            setDeleteTarget(null);
            refresh();
        } catch (err) {
            showToast("error", err instanceof Error ? err.message : t("deleteError"));
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <header className="mb-6">
                <h1 className="text-2xl font-bold tracking-widest text-accent">{t("title")}</h1>
                <p className="text-sm text-foreground/70 mt-0.5">{t("subtitle")}</p>
            </header>

            <SiteSettingsSection />

            <ManagementTab
                posts={posts}
                tags={tags}
                categories={categories}
                isLoading={isLoading}
                onRefresh={refresh}
                onAddPost={() => {
                    startNavigationLoading("/admin/posts/new");
                    router.push("/admin/posts/new");
                }}
                onAddTag={() => setShowAddTag(true)}
                onAddSeries={() => setShowAddSeries(true)}
                onEditPost={(id) => {
                    const href = `/admin/posts/${id}/edit`;
                    startNavigationLoading(href);
                    router.push(href);
                }}
                onEditTag={(tag) => setEditTag(tag)}
                onEditSeries={(series) => setEditSeries(series)}
                onDeleteConfirm={(data) => setDeleteTarget(data)}
                onShowToast={showToast}
            />

            {showAddTag && (
                <AddTagForm
                    onSuccess={() => refresh()}
                    onClose={() => setShowAddTag(false)}
                />
            )}

            {editTag && (
                <EditTagForm
                    tag={editTag}
                    onSuccess={() => refresh()}
                    onClose={() => setEditTag(null)}
                />
            )}

            {showAddSeries && (
                <SeriesForm onSuccess={() => refresh()} onClose={() => setShowAddSeries(false)} />
            )}

            {editSeries && (
                <SeriesForm series={editSeries} onSuccess={() => refresh()} onClose={() => setEditSeries(null)} />
            )}

            {deleteTarget && (
                <DeletePreviewPopup
                    data={deleteTarget}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirmDelete={confirmDelete}
                />
            )}
        </div>
    );
}

export default function AdminPage() {
    return (
        <ToastProvider>
            <AdminWorkspace />
        </ToastProvider>
    );
}
