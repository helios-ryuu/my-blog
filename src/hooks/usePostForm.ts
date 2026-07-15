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
import type { AdminTag } from "@/types/admin";

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
    const { mode, postId, onShowToast, onSuccess } = opts;

    const [formData, setFormData] = useState<PostFormData>({
        ...INITIAL_POST_FORM_DATA,
        ...opts.initialData,
    });
    const [tags, setTags] = useState<AdminTag[]>([]);
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

    const fetchTags = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/tags");
            const json = await res.json();
            if (json.success) setTags(json.data);
        } catch {
            // ignore — tag fetch failure isn't fatal.
        }
    }, []);

    const fetchPost = useCallback(async () => {
        if (mode !== "edit" || postId == null) return;
        setIsFetching(true);
        try {
            const res = await fetch(`/api/admin/posts/${postId}`);
            const json = await res.json();
            if (!json.success) {
                onShowToast?.("error", json.message || "Failed to load post");
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
                published: p.published,
            });
            setSelectedTagIds((p.tags ?? []).map((t: { id: number }) => t.id));
        } catch (e) {
            onShowToast?.("error", e instanceof Error ? e.message : "Failed to load post");
        } finally {
            setIsFetching(false);
        }
    }, [mode, postId, onShowToast]);

    useEffect(() => {
        fetchTags();
        fetchPost();
    }, [fetchTags, fetchPost]);

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
                    published: formData.published,
                    tag_ids: selectedTagIds,
                }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Save failed");
            onShowToast?.("success", mode === "create" ? "Post created" : "Post updated");
            onSuccess?.({ id: json.data.id, slug: json.data.slug });
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            setError(msg);
            onShowToast?.("error", msg);
        } finally {
            setIsLoading(false);
        }
    }, [validation.hasValidationErrors, mode, postId, formData, selectedTagIds, onShowToast, onSuccess]);

    return {
        formData,
        setFormData,
        tags,
        setTags,
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
        refreshTags: fetchTags,
    };
}
