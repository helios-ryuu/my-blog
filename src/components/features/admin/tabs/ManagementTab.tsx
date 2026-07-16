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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{t("managementTitle")}</h2>
                <Button
                    variant="utility"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
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
            <CategoryManagementSection
                categories={categories}
                isLoading={isLoading}
                onRefresh={onRefresh}
                onShowToast={onShowToast ?? (() => undefined)}
            />
            <EditSection categories={categories} tags={tags} onEditPost={onEditPost} onEditTag={onEditTag} onEditSeries={onEditSeries} />
            <DeleteSection categories={categories} tags={tags} onDeleteConfirm={onDeleteConfirm} />
        </div>
    );
}
