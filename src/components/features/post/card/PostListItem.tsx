"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { TagList } from "@/components/ui";
import PostCardContextMenu from "./PostCardContextMenu";
import PostCategoryBadge from "./PostCategoryBadge";
import ShareQRPopup from "../share/PostShareQRPopup";
import { usePostShareInteractions } from "@/hooks/usePostShareInteractions";
import type { PostItemProps } from "@/types/post";

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
    onClick,
    className = ""
}: PostItemProps) {
    const router = useRouter();
    const {
        contextMenu, showQRPopup, linkCopied, postUrl,
        handleContextMenu, handleTouchStart, handleTouchMove, handleTouchEnd,
        handleCloseMenu, handleCopyLink, handleOpenQRPopup, handleCloseQRPopup, handleDownloadMarkdown,
    } = usePostShareInteractions(slug);

    const handleClick = useCallback(() => {
        if (!contextMenu) {
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
                    grid grid-cols-[4fr_3fr_90px_80px_95px_120px] gap-4 px-4 py-2
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
                <span className="text-xs text-(--foreground-dim) whitespace-nowrap">{readingTime}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-sm w-fit ${level === 'beginner' ? 'bg-green-500/20 text-green-500' :
                    level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-500' :
                        level === 'advanced' ? 'bg-red-500/20 text-red-500' : ''
                    }`}>
                    {level ? level.charAt(0).toUpperCase() + level.slice(1) : '-'}
                </span>
                <span className="w-fit">
                    {category ? <PostCategoryBadge category={category} /> : <span className="text-xs text-foreground/40">-</span>}
                </span>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <PostCardContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    postUrl={postUrl}
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
                    postUrl={postUrl}
                    onClose={handleCloseQRPopup}
                />
            )}
        </>
    );
}
