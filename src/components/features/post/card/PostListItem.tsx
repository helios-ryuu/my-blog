"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { TagList } from "@/components/ui";
import PostCardContextMenu from "./PostCardContextMenu";
import PostCategoryBadge from "./PostCategoryBadge";
import PostLevelBadge from "./PostLevelBadge";
import PostTypeBadge from "./PostTypeBadge";
import ShareQRPopup from "../share/PostShareQRPopup";
import { usePostShareInteractions } from "@/hooks/usePostShareInteractions";
import { startNavigationLoading } from "@/lib/navigation-loading";
import type { PostItemProps } from "@/types/post";
import { useTranslations } from "next-intl";

export default function PostListItem({
    slug,
    image,
    title,
    description,
    date,
    readingTime,
    level,
    tags,
    category,
    categoryName,
    categoryIcon,
    type,
    seriesOrder,
    onClick,
    className = ""
}: PostItemProps) {
    const t = useTranslations("post");
    const router = useRouter();
    const {
        contextMenu, showQRPopup, linkCopied, postUrl,
        handleContextMenu, handleTouchStart, handleTouchMove, handleTouchEnd,
        handleCloseMenu, handleCopyLink, handleOpenQRPopup, handleCloseQRPopup, handleDownloadMarkdown,
    } = usePostShareInteractions(slug);

    const handleClick = useCallback(() => {
        if (!contextMenu) {
            startNavigationLoading(`/post/${slug}`);
            if (onClick) {
                onClick();
            } else {
                router.push(`/post/${slug}`);
            }
        }
    }, [contextMenu, onClick, router, slug]);

    return (
        <>
            <div
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`
                    grid grid-cols-[4fr_3fr_90px_90px_120px_120px_120px] gap-4 px-4 py-2
                    rounded-xl border border-(--border-color) bg-(--post-card)
                    hover:border-(--border-color-hover) hover:bg-(--post-card-hover)
                    cursor-pointer transition-colors items-center select-none
                    ${className}
                `}
            >
                <span className="text-sm font-medium truncate">{title}</span>
                <div onClick={(e) => e.stopPropagation()}>
                    <TagList tags={tags || []} variant="compact" className="mt-0" />
                </div>
                <span className="text-xs text-(--foreground-dim)">{date}</span>
                <span className="text-xs text-(--foreground-dim)">{t("readingMinutes", { count: readingTime })}</span>
                <PostLevelBadge level={level} className="w-fit" />
                <PostTypeBadge type={type} order={seriesOrder} compact />
                <span className="w-fit">
                    {category ? <PostCategoryBadge category={category} name={categoryName} icon={categoryIcon} /> : <span className="text-xs text-foreground/40">-</span>}
                </span>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <PostCardContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={handleCloseMenu}
                    onShareQR={handleOpenQRPopup}
                    linkCopied={linkCopied}
                    onCopyLink={handleCopyLink}
                    onDownloadMarkdown={handleDownloadMarkdown}
                />
            )}

            {/* QR Popup */}
            {showQRPopup && (
                <ShareQRPopup
                    image={image}
                    title={title}
                    description={description}
                    date={date}
                    readingTime={readingTime}
                    level={level}
                    tags={tags}
                    category={category}
                    categoryName={categoryName}
                    categoryIcon={categoryIcon}
                    type={type}
                    seriesOrder={seriesOrder}
                    postUrl={postUrl}
                    onClose={handleCloseQRPopup}
                />
            )}
        </>
    );
}
