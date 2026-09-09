"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import CreateSection from "../sections/CreateSection";
import DraftPostsSection from "../sections/DraftPostsSection";
import EditSection from "../sections/EditSection";
import DeleteSection, { type DeleteConfirmData } from "../sections/DeleteSection";
import CategoryManagementSection from "../sections/CategoryManagementSection";
import { Button } from "../common/Button";
import type { AdminCategory, AdminPost, AdminSeries, AdminTag } from "@/types/admin";

interface ManagementTabProps {
    posts: AdminPost[];
    tags: AdminTag[];
    categories: AdminCategory[];
    isLoading: boolean;
    onRefresh: () => void;
    onAddPost: () => void;
    onAddTag: () => void;
    onAddSeries: () => void;
    onEditPost: (id: number) => void;
    onEditTag: (tag: AdminTag) => void;
    onEditSeries: (series: AdminSeries) => void;
    onDeleteConfirm: (data: DeleteConfirmData) => void;
    onShowToast?: (type: "success" | "error" | "info" | "warning", message: string) => void;
}

export default function ManagementTab({
    posts,
    tags,
    categories,
    isLoading,
    onRefresh,
    onAddPost,
    onAddTag,
    onAddSeries,
    onEditPost,
    onEditTag,
    onEditSeries,
    onDeleteConfirm,
    onShowToast,
}: ManagementTabProps) {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");

    return (
        <div className="rounded-xl border border-(--border-color) bg-background/50 backdrop-blur-xs p-5 md:p-6 shadow-xs space-y-8">
            <div className="flex items-center justify-between pb-3 border-b border-(--border-color)/70">
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    {t("managementTitle")}
                </h2>
                <Button
                    variant="utility"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading ? true : undefined}
                    isLoading={isLoading}
                    loadingText={tCommon("loading")}
                    icon={<RefreshCw size={14} />}
                >
                    {tCommon("refresh")}
                </Button>
            </div>

            <CreateSection onAddPost={onAddPost} onAddTag={onAddTag} onAddSeries={onAddSeries} />

            <DraftPostsSection
                posts={posts}
                categories={categories}
                isLoading={isLoading}
                onEditDraft={onEditPost}
                onPublished={onRefresh}
                onShowToast={onShowToast}
            />

            <EditSection
                categories={categories}
                tags={tags}
                onEditPost={onEditPost}
                onEditTag={onEditTag}
                onEditSeries={onEditSeries}
            />

            <CategoryManagementSection
                categories={categories}
                isLoading={isLoading}
                onRefresh={onRefresh}
                onShowToast={onShowToast ?? (() => undefined)}
            />

            <DeleteSection categories={categories} tags={tags} onDeleteConfirm={onDeleteConfirm} />
        </div>
    );
}
