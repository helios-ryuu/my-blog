"use client";

import { useState, useRef, useCallback } from "react";

/**
 * Shared hook for post share interactions:
 * context menu, long-press, clipboard copy, QR popup, markdown download.
 *
 * Used by PostCard, PostListItem, and PostShareActions.
 */
export function usePostShareInteractions(slug: string) {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [showQRPopup, setShowQRPopup] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const touchMoved = useRef(false);

    const postUrl = typeof window !== "undefined"
        ? `${window.location.origin}/post/${slug}`
        : `/post/${slug}`;

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchMoved.current = false;
        longPressTimer.current = setTimeout(() => {
            if (!touchMoved.current) {
                const touch = e.touches[0];
                setContextMenu({ x: touch.clientX, y: touch.clientY });
            }
        }, 500);
    }, []);

    const handleTouchMove = useCallback(() => {
        touchMoved.current = true;
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    }, []);

    const handleCloseMenu = useCallback(() => {
        setContextMenu(null);
        setLinkCopied(false);
    }, []);

    const handleCopyLink = useCallback(async () => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(postUrl);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = postUrl;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                textarea.style.top = '-9999px';
                textarea.style.opacity = '0';
                textarea.style.pointerEvents = 'none';
                textarea.style.fontSize = '16px';
                textarea.setAttribute('readonly', '');
                document.body.appendChild(textarea);
                textarea.select();
                textarea.setSelectionRange(0, textarea.value.length);
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            setLinkCopied(true);
            setTimeout(() => {
                setContextMenu(null);
                setLinkCopied(false);
            }, 1000);
        } catch (err) {
            console.error("Failed to copy link:", err);
        }
    }, [postUrl]);

    const handleOpenQRPopup = useCallback(() => {
        setContextMenu(null);
        setShowQRPopup(true);
    }, []);

    const handleCloseQRPopup = useCallback(() => {
        setShowQRPopup(false);
    }, []);

    const handleDownloadMarkdown = useCallback(() => {
        const downloadUrl = `/api/post/${slug}/download?format=md`;
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${slug}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setContextMenu(null);
    }, [slug]);

    return {
        // State
        contextMenu,
        showQRPopup,
        linkCopied,
        postUrl,
        // Handlers
        handleContextMenu,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        handleCloseMenu,
        handleCopyLink,
        handleOpenQRPopup,
        handleCloseQRPopup,
        handleDownloadMarkdown,
    };
}
