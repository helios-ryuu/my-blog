"use client";

import { useRef, useEffect, useState } from "react";
import { Download, Copy, X, Check, Loader2 } from "lucide-react";
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

const IMAGE_LOAD_TIMEOUT_MS = 15_000;
const IMAGE_RETRY_DELAYS_MS = [0, 250, 750] as const;

type CaptureStatus = "preparing" | "ready" | "error";

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

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error || new Error("Unable to read image data"));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(blob);
    });
}

async function fetchImageDataUrl(src: string, cache: RequestCache): Promise<string> {
    if (src.startsWith("data:")) return src;

    const response = await fetch(src, { cache });
    if (!response.ok) throw new Error(`Unable to fetch image (${response.status})`);

    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) {
        throw new Error(`Unexpected image content type: ${blob.type || "unknown"}`);
    }
    return blobToDataUrl(blob);
}

async function loadImageDataUrl(src: string): Promise<string> {
    let lastError: unknown;
    for (let attempt = 0; attempt < IMAGE_RETRY_DELAYS_MS.length; attempt += 1) {
        const delay = IMAGE_RETRY_DELAYS_MS[attempt];
        if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
        try {
            return await fetchImageDataUrl(src, attempt === 0 ? "force-cache" : "reload");
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError instanceof Error ? lastError : new Error("Unable to load the post image");
}

function waitForPaint(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function waitForImage(image: HTMLImageElement): Promise<void> {
    if (!image.complete) {
        await new Promise<void>((resolve, reject) => {
            const timeout = window.setTimeout(() => {
                cleanup();
                reject(new Error(`Timed out while loading image: ${image.currentSrc || image.src}`));
            }, IMAGE_LOAD_TIMEOUT_MS);
            const cleanup = () => {
                window.clearTimeout(timeout);
                image.removeEventListener("load", handleLoad);
                image.removeEventListener("error", handleError);
            };
            const handleLoad = () => {
                cleanup();
                resolve();
            };
            const handleError = () => {
                cleanup();
                reject(new Error(`Unable to load image: ${image.currentSrc || image.src}`));
            };

            image.addEventListener("load", handleLoad, { once: true });
            image.addEventListener("error", handleError, { once: true });
        });
    }

    if (image.naturalWidth === 0 || image.naturalHeight === 0) {
        throw new Error(`Image has no rendered content: ${image.currentSrc || image.src}`);
    }

    if (typeof image.decode === "function") {
        await image.decode();
    }
}

async function waitForCaptureAssets(element: HTMLElement): Promise<void> {
    await Promise.all(Array.from(element.querySelectorAll("img"), waitForImage));
    await document.fonts?.ready;
    await waitForPaint();
}

async function createShareBlob(element: HTMLElement): Promise<Blob> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            await waitForCaptureAssets(element);
            const blob = await toBlob(element, { pixelRatio: 2 });
            if (!blob?.size) throw new Error("Unable to create the share image");
            return blob;
        } catch (error) {
            lastError = error;
            await waitForPaint();
        }
    }
    throw lastError instanceof Error ? lastError : new Error("Unable to create the share image");
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
    const [embeddedImageUrl, setEmbeddedImageUrl] = useState<string | null>(null);
    const [preparedBlob, setPreparedBlob] = useState<Blob | null>(null);
    const [captureStatus, setCaptureStatus] = useState<CaptureStatus>("preparing");
    const { showToast } = useToast();
    const t = useTranslations("post");
    const tCommon = useTranslations("common");

    const toastShownRef = useRef(false);
    const captureImageUrl = image ? getCaptureImageUrl(image) : undefined;

    useEscapeKey(onClose);

    useEffect(() => {
        let cancelled = false;
        setPreparedBlob(null);
        setCaptureStatus("preparing");

        if (!captureImageUrl) {
            setEmbeddedImageUrl(null);
            return () => {
                cancelled = true;
            };
        }

        void loadImageDataUrl(captureImageUrl).then((dataUrl) => {
            if (!cancelled) setEmbeddedImageUrl(dataUrl);
        }).catch((error) => {
            if (cancelled) return;
            console.error("Failed to prepare post image:", error);
            setCaptureStatus("error");
            showToast("error", t("imageDownloadFailed"));
        });

        return () => {
            cancelled = true;
        };
    }, [captureImageUrl, showToast, t]);

    useEffect(() => {
        if (image && !embeddedImageUrl) return;
        const card = cardRef.current;
        if (!card) return;

        let cancelled = false;
        setPreparedBlob(null);
        setCaptureStatus("preparing");
        void createShareBlob(card).then((blob) => {
            if (cancelled) return;
            setPreparedBlob(blob);
            setCaptureStatus("ready");
        }).catch((error) => {
            if (cancelled) return;
            console.error("Failed to generate share image:", error);
            setCaptureStatus("error");
            showToast("error", t("imageDownloadFailed"));
        });

        return () => {
            cancelled = true;
        };
    }, [embeddedImageUrl, image, postUrl, showToast, t]);

    useEffect(() => {
        if (captureStatus === "ready" && !toastShownRef.current) {
            showToast("info", t("qrReady"));
            toastShownRef.current = true;
        }
    }, [captureStatus, showToast, t]);

    const handleDownload = async () => {
        if (!preparedBlob || captureStatus !== "ready" || downloading) return;
        setDownloading(true);
        try {
            const fileName = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-share.png`;
            const file = new File([preparedBlob], fileName, { type: "image/png" });
            const canShareFile = isIosDevice()
                && typeof navigator.share === "function"
                && (!navigator.canShare || navigator.canShare({ files: [file] }));

            if (canShareFile) {
                try {
                    await navigator.share({ files: [file], title });
                } catch (error) {
                    if (error instanceof DOMException && error.name === "AbortError") return;
                    downloadBlob(preparedBlob, fileName);
                }
            } else {
                downloadBlob(preparedBlob, fileName);
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
        if (!preparedBlob || captureStatus !== "ready" || copied) return;
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": preparedBlob }),
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
                    disabled={captureStatus !== "ready" || !preparedBlob || downloading}
                    className="p-3 rounded-full bg-background/90 border border-(--border-color) hover:bg-accent/40 hover:border-accent cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    title={t("downloadImage")}
                >
                    {captureStatus === "preparing"
                        ? <Loader2 className="h-5 w-5 animate-spin" strokeWidth={3} />
                        : <Download className="h-5 w-5" strokeWidth={3} />}
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCopyToClipboard();
                    }}
                    disabled={captureStatus !== "ready" || !preparedBlob}
                    className="hidden sm:block p-3 rounded-full bg-background/90 border border-(--border-color) hover:bg-accent/40 hover:border-accent cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    title={t("copyImage")}
                >
                    {captureStatus === "preparing"
                        ? <Loader2 className="h-5 w-5 animate-spin" strokeWidth={3} />
                        : copied
                            ? <Check className="h-5 w-5 text-green-500" strokeWidth={3} />
                            : <Copy className="h-5 w-5" strokeWidth={3} />}
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
                        {embeddedImageUrl ? (
                            <>
                                <div className="absolute -inset-1 blur-xl opacity-16 transform-gpu">
                                    <Image
                                        src={embeddedImageUrl}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                                <div className="relative w-full h-full z-10">
                                    <Image
                                        src={embeddedImageUrl}
                                        alt={title}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-background/25 via-transparent to-transparent" />
                                </div>
                            </>
                        ) : (
                            <div className="h-full w-full animate-pulse bg-foreground/10" />
                        )}
                    </div>
                )}

                {/* Category */}
                {category && (
                    <div className="mt-2 mb-2">
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
                    <div className="mt-4">
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
