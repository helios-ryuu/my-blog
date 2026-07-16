"use client";

import { useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { shouldBypassImageOptimization } from "@/lib/images";
import { TagList } from "@/components/ui";
import StatColumns from "./PostStatColumns";
import PostCardContextMenu from "./PostCardContextMenu";
import PostCategoryBadge from "./PostCategoryBadge";
import PostLevelBadge from "./PostLevelBadge";
import PostTypeBadge from "./PostTypeBadge";
import ShareQRPopup from "../share/PostShareQRPopup";
import { usePostShareInteractions } from "@/hooks/usePostShareInteractions";
import type { PostItemProps } from "@/types/post";
import { useTranslations } from "next-intl";

export default function PostCard({
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
            if (onClick) onClick();
            else router.push(`/post/${slug}`);
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
                    relative flex flex-col w-full p-3
                    rounded-xl border border-(--border-color) bg-(--post-card)
                    cursor-pointer
                    hover:border-(--border-color-hover) hover:bg-(--post-card-hover)
                    active:border-accent
                    select-none
                    ${className}
                `}
            >
                {/* Top Section */}
                <div className="flex-none">
                    {/* Image */}
                    {image && (
                        <div className="relative w-full h-48 md:h-42 mb-4">
                            {/* Glow layer */}
                            <div className="absolute -inset-1 blur-xl opacity-14">
                                <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw" className="object-cover rounded-xl" unoptimized={shouldBypassImageOptimization(image)} />
                            </div>
                            {/* Image container */}
                            <div className="relative w-full h-full rounded-xl overflow-hidden z-10">
                                <Image src={image} alt={title} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw" className="object-cover" unoptimized={shouldBypassImageOptimization(image)} />
                                <div className="absolute inset-0 bg-linear-to-t from-background/25 via-transparent to-transparent" />
                            </div>
                        </div>
                    )}

                    {/* Category */}
                    {category && (
                        <div className="mt-2 mb-1">
                            <PostCategoryBadge category={category} name={categoryName} icon={categoryIcon} />
                        </div>
                    )}

                    {/* Title */}
                    {title && (
                        <h2 className="font-semibold text-lg tracking-wide line-clamp-2 leading-tight">{title}</h2>
                    )}

                    {/* Description */}
                    {description && (
                        <p className="text-xs text-foreground/70 mt-1 line-clamp-5">{description}</p>
                    )}

                    {/* Tags */}
                    {tags && (
                        <div className="mt-4 mb-2">
                            <TagList
                                tags={tags}
                                variant="compact"
                            />
                        </div>
                    )}

                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Bottom Section */}
                <div className="flex-none">
                    <div className="w-full border-t border-(--border-color) mt-4 mb-2" />
                    <StatColumns stats={[
                        ...(date ? [{ label: t("date"), value: date }] : []),
                        { label: t("read"), value: t("readingMinutes", { count: readingTime }) },
                        { label: t("level"), value: <PostLevelBadge level={level} compact /> },
                    ]} />
                    <PostTypeBadge type={type} order={seriesOrder} fullWidth className="mt-2" />
                </div>
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
