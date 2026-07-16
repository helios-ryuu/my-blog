"use client";

import { useCallback, useEffect, useState } from "react";
import { serialize } from "next-mdx-remote/serialize";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import remarkGfm from "remark-gfm";
import {
    INITIAL_POST_FORM_DATA,
    usePostFormValidation,
    type PostFormData,
} from "./usePostFormValidation";
import type { AdminCategory, AdminSeries, AdminTag } from "@/types/admin";
import { useTranslations } from "next-intl";

type ToastFn = (type: "success" | "error" | "info" | "warning", message: string) => void;

interface UsePostFormOptions {
    mode: "create" | "edit";
    postId?: number;
    initialData?: Partial<PostFormData>;
    initialTagIds?: number[];
    existingTitles?: string[];
    existingSlugs?: string[];
    onShowToast?: ToastFn;
    onSuccess?: (post: { id: number; slug: string }) => void;
}

export function usePostForm(opts: UsePostFormOptions) {
    const t = useTranslations("admin");
    const { mode, postId, onShowToast, onSuccess } = opts;

    const [formData, setFormData] = useState<PostFormData>({
        ...INITIAL_POST_FORM_DATA,
        ...opts.initialData,
    });
    const [tags, setTags] = useState<AdminTag[]>([]);
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [series, setSeries] = useState<AdminSeries[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>(opts.initialTagIds ?? []);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(mode === "edit");
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
    const [isRendering, setIsRendering] = useState(false);

    const validation = usePostFormValidation(formData, {
        existingTitles: opts.existingTitles,
        existingSlugs: opts.existingSlugs,
    });

    const fetchTaxonomy = useCallback(async () => {
        try {
            const [tagsResponse, categoriesResponse, seriesResponse] = await Promise.all([
                fetch("/api/admin/tags"),
                fetch("/api/admin/categories"),
                fetch("/api/admin/series?pageSize=50"),
            ]);
            const [tagsResult, categoriesResult, seriesResult] = await Promise.all([
                tagsResponse.json(),
                categoriesResponse.json(),
                seriesResponse.json(),
            ]);
            if (tagsResult.success) setTags(tagsResult.data);
            if (categoriesResult.success) setCategories(categoriesResult.data);
            if (seriesResult.success) setSeries(seriesResult.data.items ?? []);
        } catch {
            // Taxonomy fetch errors are surfaced if the post save is attempted.
        }
    }, []);

    const fetchPost = useCallback(async () => {
        if (mode !== "edit" || postId == null) return;
        setIsFetching(true);
        try {
            const res = await fetch(`/api/admin/posts/${postId}`);
            const json = await res.json();
            if (!json.success) {
                onShowToast?.("error", json.message || t("loadError"));
                return;
            }
            const p = json.data;
            setFormData({
                title: p.title,
                slug: p.slug,
                description: p.description,
                content: p.content,
                image_url: p.image_url ?? "",
                category: p.category,
                level: p.level,
                reading_time: p.reading_time,
                post_type: p.series_id ? "series" : "standalone",
                series_id: p.series_id,
                series_order: p.series_order,
                published: p.published,
            });
            setSelectedTagIds((p.tags ?? []).map((t: { id: number }) => t.id));
        } catch (e) {
            onShowToast?.("error", e instanceof Error ? e.message : t("loadError"));
        } finally {
            setIsFetching(false);
        }
    }, [mode, postId, onShowToast, t]);

    useEffect(() => {
        fetchTaxonomy();
        fetchPost();
    }, [fetchPost, fetchTaxonomy]);

    // Debounced live preview render — re-runs ~500ms after content stops changing.
    useEffect(() => {
        if (!formData.content.trim()) {
            setMdxSource(null);
            return;
        }
        let cancelled = false;
        const handle = setTimeout(async () => {
            setIsRendering(true);
            try {
                const src = await serialize(formData.content, {
                    mdxOptions: { remarkPlugins: [remarkGfm] },
                });
                if (!cancelled) setMdxSource(src);
            } catch {
                // Render errors are surfaced through the preview pane state; no toast spam.
            } finally {
                if (!cancelled) setIsRendering(false);
            }
        }, 500);
        return () => {
            cancelled = true;
            clearTimeout(handle);
        };
    }, [formData.content]);

    const toggleTag = useCallback((id: number) => {
        setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
    }, []);

    const submit = useCallback(async () => {
        setSubmitted(true);
        if (validation.hasValidationErrors) return;
        setIsLoading(true);
        setError("");
        try {
            const url = mode === "create" ? "/api/admin/posts" : `/api/admin/posts/${postId}`;
            const method = mode === "create" ? "POST" : "PATCH";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slug: formData.slug,
                    title: formData.title,
                    description: formData.description,
                    content: formData.content,
                    image_url: formData.image_url || null,
                    category: formData.category,
                    level: formData.level,
                    reading_time: formData.reading_time,
                    series_id: formData.post_type === "series" ? formData.series_id : null,
                    series_order: formData.post_type === "series" ? formData.series_order : null,
                    published: formData.published,
                    tag_ids: selectedTagIds,
                }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || t("savePostError"));
            onShowToast?.("success", mode === "create" ? t("postCreated") : t("postUpdated"));
            onSuccess?.({ id: json.data.id, slug: json.data.slug });
        } catch (e) {
            const msg = e instanceof Error ? e.message : t("unknownError");
            setError(msg);
            onShowToast?.("error", msg);
        } finally {
            setIsLoading(false);
        }
    }, [validation.hasValidationErrors, mode, postId, formData, selectedTagIds, onShowToast, onSuccess, t]);

    return {
        formData,
        setFormData,
        tags,
        setTags,
        categories,
        series,
        setSeries,
        selectedTagIds,
        setSelectedTagIds,
        toggleTag,
        validation,
        submitted,
        mdxSource,
        isRendering,
        isLoading,
        isFetching,
        error,
        submit,
        refreshTags: fetchTaxonomy,
    };
}
