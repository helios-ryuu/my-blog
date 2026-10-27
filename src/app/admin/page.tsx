"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/Toast";
import { useAdminCache, formatLoadedTime } from "@/contexts/AdminCacheContext";
import ManagementTab from "@/components/features/admin/tabs/ManagementTab";
import AddPostForm from "@/components/features/admin/forms/AddPostForm";
import AddTagForm from "@/components/features/admin/forms/AddTagForm";
import DeletePreviewPopup from "@/components/features/admin/common/DeletePreviewPopup";
import EditTagForm from "@/components/features/admin/forms/EditTagForm";
import SiteSettingsSection from "@/components/features/admin/sections/SiteSettingsSection";
import SeriesForm from "@/components/features/admin/forms/SeriesForm";
import EditPostForm from "@/components/features/admin/forms/EditPostForm";
import UploadPostModal from "@/components/features/admin/modals/UploadPostModal";
import DocsEditorModal from "@/components/features/admin/modals/DocsEditorModal";
import type { AdminSeries, AdminTag, DeleteConfirmData } from "@/types/admin";

export default function AdminPage() {
    const { showToast } = useToast();
    const t = useTranslations("admin");
    const tDelete = useTranslations("deletePopup");

    const {
        posts,
        tags,
        categories,
        docsConfig,
        setDocsConfig,
        pendingDocsEditorSlug,
        setPendingDocsEditorSlug,
        pendingEditPostId,
        setPendingEditPostId,
        isAdminLoading,
        adminLoadedAt,
        ensureAdminLoaded,
        refreshAdminData,
    } = useAdminCache();

    const [showAddPost, setShowAddPost] = useState(false);
    const [showAddTag, setShowAddTag] = useState(false);
    const [editTag, setEditTag] = useState<AdminTag | null>(null);
    const [showAddSeries, setShowAddSeries] = useState(false);
    const [editSeries, setEditSeries] = useState<AdminSeries | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteConfirmData | null>(null);
    const [showUploadPost, setShowUploadPost] = useState(false);
    const [docsEditorTargetSlug, setDocsEditorTargetSlug] = useState<string | null>(null);
    const [editPostId, setEditPostId] = useState<number | null>(null);

    const handleRefresh = useCallback(() => {
        void refreshAdminData((msg) => showToast("error", msg || t("loadError")));
    }, [refreshAdminData, showToast, t]);

    useEffect(() => {
        void ensureAdminLoaded((msg) => showToast("error", msg || t("loadError")));
    }, [ensureAdminLoaded, showToast, t]);

    useEffect(() => {
        if (pendingDocsEditorSlug !== null) {
            setDocsEditorTargetSlug(pendingDocsEditorSlug);
            setPendingDocsEditorSlug(null);
            if (typeof window !== "undefined" && window.location.search.includes("editDocs")) {
                window.history.replaceState(null, "", "/admin");
            }
            return;
        }
        if (pendingEditPostId !== null) {
            setEditPostId(pendingEditPostId);
            setPendingEditPostId(null);
            if (typeof window !== "undefined" && window.location.search.includes("editPost")) {
                window.history.replaceState(null, "", "/admin");
            }
            return;
        }
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const editDocsSlug = params.get("editDocs");
            if (editDocsSlug !== null) {
                setDocsEditorTargetSlug(editDocsSlug);
                window.history.replaceState(null, "", "/admin");
            }
            const editPostParam = params.get("editPost");
            if (editPostParam !== null) {
                const parsedId = Number(editPostParam);
                if (!Number.isNaN(parsedId) && parsedId > 0) {
                    setEditPostId(parsedId);
                }
                window.history.replaceState(null, "", "/admin");
            }
        }
    }, [pendingDocsEditorSlug, setPendingDocsEditorSlug, pendingEditPostId, setPendingEditPostId]);

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
            const typeLabel = deleteTarget.type === "post"
                ? tDelete("typePost")
                : deleteTarget.type === "tag"
                    ? tDelete("typeTag")
                    : tDelete("typeSeries");
            showToast("success", t("deleteSuccess", { type: typeLabel }));
            setDeleteTarget(null);
            handleRefresh();
        } catch (err) {
            showToast("error", err instanceof Error ? err.message : t("deleteError"));
        }
    }

    return (
        <div className="max-w-[1760px] w-full mx-auto px-4 md:px-8 xl:px-10 py-6 md:py-8 space-y-6">
            <div>
                <h1 className="text-xl font-bold uppercase tracking-wider text-foreground">{t("title")}</h1>
                <p className="text-xs text-foreground/60 mt-1">{t("subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-15 gap-6 xl:gap-8 items-start">
                <div className="xl:col-span-10 2xl:col-span-11 min-w-0">
                    <ManagementTab
                        posts={posts}
                        tags={tags}
                        categories={categories}
                        docsConfig={docsConfig}
                        isLoading={isAdminLoading}
                        loadedTime={formatLoadedTime(adminLoadedAt)}
                        onRefresh={handleRefresh}
                        onAddPost={() => setShowAddPost(true)}
                        onOpenUploadPost={() => setShowUploadPost(true)}
                        onOpenDocsEditor={(slug) => setDocsEditorTargetSlug(slug ?? "")}
                        onAddTag={() => setShowAddTag(true)}
                        onAddSeries={() => setShowAddSeries(true)}
                        onEditPost={(id) => setEditPostId(id)}
                        onEditTag={(tag) => setEditTag(tag)}
                        onEditSeries={(series) => setEditSeries(series)}
                        onDeleteConfirm={(data) => setDeleteTarget(data)}
                        onShowToast={showToast}
                    />
                </div>

                <div className="xl:col-span-5 2xl:col-span-4 space-y-6 min-w-0">
                    <SiteSettingsSection />
                </div>
            </div>

            {showUploadPost && (
                <UploadPostModal
                    posts={posts}
                    categories={categories}
                    tags={tags}
                    onClose={() => setShowUploadPost(false)}
                    onSuccess={() => handleRefresh()}
                    onEditPost={(id) => setEditPostId(id)}
                    onShowToast={showToast}
                />
            )}

            {showAddPost && (
                <AddPostForm
                    onClose={() => setShowAddPost(false)}
                    onSuccess={() => {
                        setShowAddPost(false);
                        handleRefresh();
                    }}
                    onShowToast={showToast}
                    existingTitles={posts.map((p) => p.title)}
                    existingSlugs={posts.map((p) => p.slug)}
                />
            )}

            {editPostId !== null && (
                <EditPostForm
                    postId={editPostId}
                    onClose={() => setEditPostId(null)}
                    onSuccess={() => {
                        setEditPostId(null);
                        handleRefresh();
                    }}
                    onShowToast={showToast}
                    existingSlugs={posts.filter((p) => p.id !== editPostId).map((p) => p.slug)}
                />
            )}

            {docsEditorTargetSlug !== null && (
                <DocsEditorModal
                    initialConfig={docsConfig}
                    initialActiveSlug={docsEditorTargetSlug || undefined}
                    onClose={() => setDocsEditorTargetSlug(null)}
                    onSaved={(updated) => setDocsConfig(updated)}
                    onShowToast={showToast}
                />
            )}

            {showAddTag && (
                <AddTagForm
                    onSuccess={() => handleRefresh()}
                    onClose={() => setShowAddTag(false)}
                />
            )}

            {editTag && (
                <EditTagForm
                    tag={editTag}
                    onSuccess={() => handleRefresh()}
                    onClose={() => setEditTag(null)}
                />
            )}

            {showAddSeries && (
                <SeriesForm onSuccess={() => handleRefresh()} onClose={() => setShowAddSeries(false)} />
            )}

            {editSeries && (
                <SeriesForm series={editSeries} onSuccess={() => handleRefresh()} onClose={() => setEditSeries(null)} />
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
