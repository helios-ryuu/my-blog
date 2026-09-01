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
const CAPTURE_RETRY_COUNT = 3;
const BLUR_BACKGROUND_PX = 24; // matches Tailwind's blur-xl
const BLUR_LAYER_OPACITY = 0.16; // matches Tailwind's opacity-16

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

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Unable to decode image for blur pre-render"));
        img.src = src;
    });
}

/**
 * Root-cause fix: html-to-image serializes the DOM to an SVG <foreignObject> before
 * rasterizing it to canvas. Live CSS `filter: blur()` on an element inside that
 * foreignObject is rasterized unreliably across browsers/GPU drivers — it is a known
 * source of "randomly missing content" in html-to-image/dom-to-image output.
 *
 * Instead of relying on the browser to blur the layer *during* capture, we pre-render
 * the blurred background once (via canvas 2D `ctx.filter`, which is reliable outside
 * of the foreignObject/SVG pipeline) and embed the *result* as a plain, already-blurred
 * <img>. No live filter is present in the DOM at capture time.
 */
async function createBlurredBackgroundDataUrl(sourceDataUrl: string): Promise<string> {
    const img = await loadHtmlImage(sourceDataUrl);

    // Small canvas is enough — this is a decorative, heavily blurred background.
    const targetWidth = 160;
    const targetHeight = Math.round((img.height / img.width) * targetWidth) || targetWidth;

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable for blur pre-render");

    ctx.filter = `blur(${BLUR_BACKGROUND_PX}px)`;
    ctx.globalAlpha = BLUR_LAYER_OPACITY;
    // Draw slightly oversized to avoid transparent blur fringes at the edges.
    ctx.drawImage(img, -8, -8, targetWidth + 16, targetHeight + 16);

    return canvas.toDataURL("image/png");
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

/**
 * Safety net for any *other* source of missing content (not just the blur layer above).
 * Decodes the produced blob and samples pixels inside the primary image region; a real
 * photo always has pixel variance, whereas a region that failed to rasterize renders as
 * a flat background color. Sampling several points avoids a false negative from
 * landing on a single flat-colored area of a legitimate photo.
 */
async function hasVisibleImageContent(blob: Blob, imageRegion: DOMRect, elementRegion: DOMRect, canvasSize: { width: number; height: number }): Promise<boolean> {
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(blob);
    } catch {
        // If we can't even decode it, treat as invalid so the caller retries.
        return false;
    }

    const canvas = document.createElement("canvas");
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true; // can't validate, don't block on it
    ctx.drawImage(bitmap, 0, 0);

    const scaleX = canvasSize.width / elementRegion.width;
    const scaleY = canvasSize.height / elementRegion.height;

    const samplePoints: Array<[number, number]> = [
        [0.5, 0.5], [0.2, 0.3], [0.8, 0.3], [0.2, 0.7], [0.8, 0.7],
    ];

    let identicalNeighborCount = 0;
    let previous: Uint8ClampedArray | null = null;

    for (const [fx, fy] of samplePoints) {
        const x = Math.min(
            canvasSize.width - 1,
            Math.max(0, Math.round((imageRegion.left - elementRegion.left + imageRegion.width * fx) * scaleX)),
        );
        const y = Math.min(
            canvasSize.height - 1,
            Math.max(0, Math.round((imageRegion.top - elementRegion.top + imageRegion.height * fy) * scaleY)),
        );

        const pixel = ctx.getImageData(x, y, 1, 1).data;
        if (previous && pixel[0] === previous[0] && pixel[1] === previous[1] && pixel[2] === previous[2]) {
            identicalNeighborCount += 1;
        }
        previous = pixel;
    }

    // A real photo will virtually never produce 4+ identical consecutive samples.
    return identicalNeighborCount < 4;
}

async function createShareBlob(element: HTMLElement): Promise<Blob> {
    const primaryImageLayer = element.querySelector<HTMLElement>("[data-capture-role='primary-image']");

    let lastError: unknown;
    for (let attempt = 0; attempt < CAPTURE_RETRY_COUNT; attempt += 1) {
        try {
            await waitForCaptureAssets(element);

            // Warm-up pass: html-to-image's first foreignObject decode on a given DOM
            // shape is the least reliable one (browser image-decode cache is cold).
            // Discard this result and capture again once the pipeline is "warm".
            await toBlob(element, { pixelRatio: 2 });
            await waitForPaint();

            const blob = await toBlob(element, { pixelRatio: 2 });
            if (!blob?.size) throw new Error("Unable to create the share image");

            if (primaryImageLayer) {
                const elementRegion = element.getBoundingClientRect();
                const imageRegion = primaryImageLayer.getBoundingClientRect();
                const dpr = 2; // matches pixelRatio above
                const valid = await hasVisibleImageContent(blob, imageRegion, elementRegion, {
                    width: Math.round(elementRegion.width * dpr),
                    height: Math.round(elementRegion.height * dpr),
                });
                if (!valid) throw new Error("Captured image is missing its photo layer");
            }

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
    const [blurredBackgroundUrl, setBlurredBackgroundUrl] = useState<string | null>(null);
    const [preparedBlob, setPreparedBlob] = useState<Blob | null>(null);
    const [captureStatus, setCaptureStatus] = useState<CaptureStatus>("preparing");
    const { showToast } = useToast();
    const t = useTranslations("post");
    const tCommon = useTranslations("common");

    const toastShownRef = useRef(false);
    const captureImageUrl = image ? getCaptureImageUrl(image) : undefined;

    useEscapeKey(onClose);

    // Step 1: fetch the source image as a data URL (unchanged from before).
    useEffect(() => {
        let cancelled = false;
        setPreparedBlob(null);
        setEmbeddedImageUrl(null);
        setBlurredBackgroundUrl(null);
        setCaptureStatus("preparing");

        if (!captureImageUrl) {
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

    // Step 2: once we have the source image, pre-render the blurred background as a
    // static image *before* capture — this is what removes the live CSS filter that
    // was causing content to go missing.
    useEffect(() => {
        if (!embeddedImageUrl) return;

        let cancelled = false;
        void createBlurredBackgroundDataUrl(embeddedImageUrl).then((url) => {
            if (!cancelled) setBlurredBackgroundUrl(url);
        }).catch((error) => {
            if (cancelled) return;
            console.error("Failed to pre-render blurred background:", error);
            // Non-fatal: fall back to no background layer rather than blocking export.
            setBlurredBackgroundUrl(null);
        });

        return () => {
            cancelled = true;
        };
    }, [embeddedImageUrl]);

    // Step 3: capture the card once all image layers (including the pre-blurred one)
    // are settled.
    useEffect(() => {
        // Wait for both the source image and its pre-blurred background to be ready
        // before capturing, so no image layer is still swapping in mid-capture.
        if (image && (!embeddedImageUrl || blurredBackgroundUrl === null)) return;

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [embeddedImageUrl, blurredBackgroundUrl, image, postUrl, showToast, t]);

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
                                {/*
                                  Background layer: a *pre-blurred, static* image, not a live
                                  CSS filter. This is what fixes the intermittent missing-image
                                  export bug — see createBlurredBackgroundDataUrl above.
                                  Rendered only once blurredBackgroundUrl is ready so nothing
                                  shifts mid-capture; falls back to nothing if pre-render fails.
                                */}
                                {blurredBackgroundUrl && (
                                    <div className="absolute -inset-1 transform-gpu" aria-hidden="true">
                                        <Image
                                            src={blurredBackgroundUrl}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                )}
                                <div
                                    className="relative w-full h-full z-10"
                                    data-capture-role="primary-image"
                                >
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
                        <Image src="/favicon.ico" alt="Helios Space" width={26} height={26} className="rounded-sm" unoptimized />
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