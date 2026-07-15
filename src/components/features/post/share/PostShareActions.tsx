"use client";

import { Share2 } from "lucide-react";
import PostCardContextMenu from "../card/PostCardContextMenu";
import ShareQRPopup from "./PostShareQRPopup";
import { usePostShareInteractions } from "@/hooks/usePostShareInteractions";
import type { Post } from "@/types/post";

interface PostShareActionsProps {
    post: Post;
}

export default function PostShareActions({ post }: PostShareActionsProps) {
    const {
        contextMenu, showQRPopup, linkCopied, postUrl,
        handleContextMenu, handleCloseMenu, handleCopyLink,
        handleOpenQRPopup, handleCloseQRPopup, handleDownloadMarkdown,
    } = usePostShareInteractions(post.slug);

    return (
        <div className="mt-6 flex justify-center">
            <button
                onClick={handleContextMenu}
                className={`
                    flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors
                    ${contextMenu
                        ? "text-foreground bg-accent/20 border border-accent-hover/60"
                        : "text-foreground/70 border border-background-hover/70 bg-background-hover/30 hover:text-foreground hover:bg-accent/10 hover:border-accent/20"
                    }
                `}
            >
                <Share2 className="w-4 h-4" />
                Share this post
            </button>

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
                    image={post.image}
                    title={post.title}
                    description={post.description}
                    date={post.date}
                    readingTime={post.readingTime}
                    level={post.level}
                    tags={post.tags}
                    category={post.category}
                    postUrl={postUrl}
                    onClose={handleCloseQRPopup}
                />
            )}
        </div>
    );
}
