"use client";

import { useRef, useEffect, useState } from "react";
import { Download, Copy, X, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toBlob } from "html-to-image";
import Image from "next/image";

import { useTranslations } from "next-intl";
import { TagList } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import StatColumns from "../card/PostStatColumns";
import PostCategoryBadge from "../card/PostCategoryBadge";
import PostLevelBadge from "../card/PostLevelBadge";
import PostTypeBadge from "../card/PostTypeBadge";
import type { PostCategory, PostLevel, PostType } from "@/types/database";

interface ShareQRPopupProps {
    image?: string;
    title: string;
    description: string;
    date?: string;
    readingTime: number;
    level: PostLevel;
    tags?: string[];
    category?: PostCategory;
    categoryName?: string;
    categoryIcon?: string | null;
    type: PostType;
    seriesOrder?: number | null;
    postUrl: string;
    onClose: () => void;
}

const TRANSPARENT_PIXEL =
    "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

function getCaptureImageUrl(src: string): string {
    return /^https?:\/\//i.test(src)
        ? `/api/media/share?url=${encodeURIComponent(src)}`
        : src;
}

function isIosDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = url;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export default function ShareQRPopup({
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
    postUrl,
    onClose,
}: ShareQRPopupProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const { showToast } = useToast();
    const t = useTranslations("post");
    const tCommon = useTranslations("common");

    const toastShownRef = useRef(false);
    const captureImageUrl = image ? getCaptureImageUrl(image) : undefined;

    useEscapeKey(onClose);

    useEffect(() => {
        if (!toastShownRef.current) {
            showToast("info", t("qrReady"));
            toastShownRef.current = true;
        }
    }, [showToast, t]);
    // Helper to wait for all images to load
    const waitForImages = async (element: HTMLElement): Promise<void> => {
        const images = element.querySelectorAll('img');
        const promises = Array.from(images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Resolve even on error to prevent hang
            });
        });
        await Promise.all(promises);
        // Extra delay to ensure rendering is complete
        await new Promise(resolve => setTimeout(resolve, 100));
    };

    const handleDownload = async () => {
        if (!cardRef.current || downloading) return;
        setDownloading(true);
        try {
            // Wait for all images to load before capturing
            await waitForImages(cardRef.current);

            const blob = await toBlob(cardRef.current, {
                pixelRatio: 2,
                cacheBust: true,
                imagePlaceholder: TRANSPARENT_PIXEL,
                onImageErrorHandler: () => undefined,
            });
            if (!blob) throw new Error("Unable to create the share image");

            const fileName = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-share.png`;
            const file = new File([blob], fileName, { type: "image/png" });
            const canShareFile = isIosDevice()
                && typeof navigator.share === "function"
                && (!navigator.canShare || navigator.canShare({ files: [file] }));

            if (canShareFile) {
                try {
                    await navigator.share({ files: [file], title });
                } catch (error) {
                    if (error instanceof DOMException && error.name === "AbortError") return;
                    downloadBlob(blob, fileName);
                }
            } else {
                downloadBlob(blob, fileName);
            }
            showToast("success", t("imageDownloaded"));
        } catch (err) {
            console.error("Failed to generate image:", err);
            showToast("error", t("imageDownloadFailed"));
        } finally {
            setDownloading(false);
        }
    };

    const handleCopyToClipboard = async () => {
        if (!cardRef.current || copied) return;
        try {
            // Wait for all images to load before capturing
            await waitForImages(cardRef.current);

            const blob = await toBlob(cardRef.current, {
                pixelRatio: 2,
                cacheBust: true,
                imagePlaceholder: TRANSPARENT_PIXEL,
                onImageErrorHandler: () => undefined,
            });
            if (!blob) throw new Error("Unable to create the share image");
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ]);
            setCopied(true);
            showToast("success", t("imageCopied"));
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy image:", err);
            showToast("error", t("imageCopyFailed"));
        }
    };

    return (
        <div
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            onTouchMove={onClose}
        >
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDownload();
                    }}
                    disabled={downloading}
                    className="p-3 rounded-full bg-background/90 border border-(--border-color) hover:bg-accent/40 hover:border-accent cursor-pointer transition-colors disabled:opacity-50"
                    title={t("downloadImage")}
                >
                    <Download className="w-5 h-5" strokeWidth={3} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCopyToClipboard();
                    }}
                    className="hidden sm:block p-3 rounded-full bg-background/90 border border-(--border-color) hover:bg-accent/40 hover:border-accent cursor-pointer transition-colors"
                    title={t("copyImage")}
                >
                    {copied ? <Check className="w-5 h-5 text-green-500" strokeWidth={3} /> : <Copy className="w-5 h-5" strokeWidth={3} />}
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="p-3 rounded-full bg-background/90 border border-(--border-color) hover:bg-red-500/40 hover:border-red-500 cursor-pointer transition-colors"
                    title={tCommon("close")}
                >
                    <X className="w-5 h-5" strokeWidth={3} />
                </button>
            </div>

            {/* Card Preview */}
            <div
                ref={cardRef}
                key={postUrl}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-94 p-3 rounded-xl border border-(--border-color) bg-(--post-card)"
            >
                {/* Image */}
                {image && (
                    <div className="relative w-full h-44 md:h-42 mb-4 rounded-xl overflow-hidden">
                        <div className="absolute -inset-1 blur-xl opacity-16 transform-gpu">
                            <Image
                                src={captureImageUrl!}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                        <div className="relative w-full h-full z-10">
                            <Image
                                src={captureImageUrl!}
                                alt={title}
                                fill
                                className="object-cover"
                                unoptimized
                            />
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
                    <p className="text-xs text-foreground/70 mt-1 line-clamp-4">{description}</p>
                )}

                {/* Tags */}
                {tags && (
                    <div className="mt-2">
                        <TagList tags={tags} variant="compact" />
                    </div>
                )}

                {/* QR Code Section */}
                <div className="flex items-center justify-between mt-4 pt-2 border-t border-(--border-color)">
                    <div className="flex items-center ml-8 gap-2 text-xs text-foreground/60">
                        <Image src="/favicon.ico" alt="Helios Blog" width={26} height={26} className="rounded-sm" unoptimized />
                        <span className="font-medium text-accent/80 tracking-widest text-[10px]">{t("findOutMore")}</span>
                    </div>
                    <div className="bg-[#fcfcfc] mr-12 p-1 rounded text-[#1a1a1a]">
                        <QRCodeSVG
                            value={postUrl}
                            size={74}
                            level="M"
                            bgColor="transparent"
                            fgColor="currentColor"
                        />
                    </div>
                </div>

                {/* Delimiter */}
                <div className="w-full border-t border-(--border-color) mt-2 mb-2" />

                {/* Stats */}
                <StatColumns stats={[
                    ...(date ? [{ label: t("date"), value: date }] : []),
                    { label: t("read"), value: t("readingMinutes", { count: readingTime }) },
                    { label: t("level"), value: <PostLevelBadge level={level} /> },
                ]} />
                <PostTypeBadge type={type} order={seriesOrder} fullWidth className="mt-2" />

            </div>
        </div>
    );
}
