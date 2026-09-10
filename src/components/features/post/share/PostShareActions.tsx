"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit3, Share2 } from "lucide-react";
import PostCardContextMenu from "../card/PostCardContextMenu";
import ShareQRPopup from "./PostShareQRPopup";
import { usePostShareInteractions } from "@/hooks/usePostShareInteractions";
import { useUser } from "@/contexts/UserContext";
import type { Post } from "@/types/post";
import { useTranslations } from "next-intl";

interface PostShareActionsProps {
    post: Post;
}

export default function PostShareActions({ post }: PostShareActionsProps) {
    const t = useTranslations("post");
    const { user } = useUser();
    const [postId, setPostId] = useState<number | null>(post?.id ?? null);

    useEffect(() => {
        if (post?.id) {
            setPostId(post.id);
            return;
        }
        fetch(`/api/posts/${post.slug}`)
            .then((res) => res.json())
            .then((json) => {
                if (json?.data?.id) {
                    setPostId(json.data.id);
                }
            })
            .catch(() => {});
    }, [post?.id, post?.slug]);

    const {
        contextMenu, showQRPopup, linkCopied, postUrl,
        handleContextMenu, handleCloseMenu, handleCopyLink,
        handleOpenQRPopup, handleCloseQRPopup, handleDownloadMarkdown,
    } = usePostShareInteractions(post.slug);

    return (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
                onClick={handleContextMenu}
                className={`
                    flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer
                    ${contextMenu
                        ? "text-foreground bg-accent/20 border border-accent-hover/60"
                        : "text-foreground/70 border border-background-hover/70 bg-background-hover/30 hover:text-foreground hover:bg-accent/10 hover:border-accent/20"
                    }
                `}
            >
                <Share2 className="w-4 h-4" />
                {t("shareThisPost")}
            </button>

            {user && (
                <Link
                    href={postId ? `/admin/posts/${postId}/edit` : `/admin/posts/${post.slug}/edit`}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer text-foreground/70 border border-background-hover/70 bg-background-hover/30 hover:text-foreground hover:bg-yellow-500/10 hover:border-yellow-500/30"
                >
                    <Edit3 className="w-4 h-4 text-yellow-500" />
                    {t("editThisPost")}
                </Link>
            )}

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
                    image={post.image}
                    title={post.title}
                    description={post.description}
                    date={post.date}
                    readingTime={post.readingTime}
                    level={post.level}
                    tags={post.tags}
                    category={post.category}
                    categoryName={post.categoryName}
                    categoryIcon={post.categoryIcon}
                    type={post.type}
                    seriesOrder={post.seriesOrder}
                    postUrl={postUrl}
                    onClose={handleCloseQRPopup}
                />
            )}
        </div>
    );
}
