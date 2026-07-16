"use client";

import { useState, useEffect, useMemo } from "react";
import { CHAR_LIMITS } from "@/types/admin";
import type { PostCategory, PostLevel, PostType } from "@/types/database";
import { useTranslations } from "next-intl";

export interface PostFormData {
    title: string;
    slug: string;
    description: string;
    content: string;
    image_url: string;
    category: PostCategory;
    level: PostLevel;
    reading_time: number;
    post_type: PostType;
    series_id: number | null;
    series_order: number | null;
    published: boolean;
}

export const INITIAL_POST_FORM_DATA: PostFormData = {
    title: "",
    slug: "",
    description: "",
    content: "",
    image_url: "",
    category: "articles",
    level: "beginner",
    reading_time: 5,
    post_type: "standalone",
    series_id: null,
    series_order: null,
    published: false,
};

export function usePostFormValidation(
    formData: PostFormData,
    opts?: { existingTitles?: string[]; existingSlugs?: string[] }
) {
    const t = useTranslations("admin");
    const [imageUrlValid, setImageUrlValid] = useState(true);

    useEffect(() => {
        if (!formData.image_url) {
            return;
        }

        let cancelled = false;
        const img = new window.Image();
        img.onload = () => {
            if (!cancelled) setImageUrlValid(true);
        };
        img.onerror = () => {
            if (!cancelled) setImageUrlValid(false);
        };
        img.src = formData.image_url;

        return () => {
            cancelled = true;
        };
    }, [formData.image_url]);

    const validationErrors = useMemo(() => {
        const errors: Record<string, string> = {};

        if (!formData.title.trim()) errors.title = t("titleRequired");
        else if (formData.title.length > CHAR_LIMITS.title) {
            errors.title = t("titleTooLong", { count: CHAR_LIMITS.title });
        }

        if (!formData.slug.trim()) errors.slug = t("slugRequired");
        else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
            errors.slug = t("postSlugInvalid");
        }

        if (!formData.description.trim()) errors.description = t("descriptionRequired");
        else if (formData.description.length > CHAR_LIMITS.description) {
            errors.description = t("descriptionTooLong", { count: CHAR_LIMITS.description });
        }

        if (!formData.content.trim()) errors.content = t("contentRequired");
        else if (formData.content.length > CHAR_LIMITS.content) {
            errors.content = t("contentTooLong", { count: CHAR_LIMITS.content });
        }

        if (opts?.existingTitles?.some(t => t.toLowerCase() === formData.title.trim().toLowerCase())) {
            errors.title = t("titleDuplicate");
        }
        if (opts?.existingSlugs?.includes(formData.slug.trim())) {
            errors.slug = t("slugDuplicate");
        }

        if (!Number.isSafeInteger(formData.reading_time) || formData.reading_time < 1 || formData.reading_time > 120) {
            errors.reading_time = t("readingTimeInvalid");
        }
        if (formData.post_type === "series") {
            if (!formData.series_id) errors.series_id = t("seriesRequired");
            if (!Number.isSafeInteger(formData.series_order) || Number(formData.series_order) < 1) {
                errors.series_order = t("seriesOrderInvalid");
            }
        }

        return errors;
    }, [formData.title, formData.slug, formData.description, formData.content, formData.reading_time, formData.post_type, formData.series_id, formData.series_order, opts?.existingTitles, opts?.existingSlugs, t]);

    const validationWarnings = useMemo(() => {
        const warnings: Record<string, string> = {};
        if (!imageUrlValid && formData.image_url) {
            warnings.image_url = t("imageUrlWarning");
        }
        return warnings;
    }, [formData.image_url, imageUrlValid, t]);

    const hasValidationErrors = Object.keys(validationErrors).length > 0;

    return { validationErrors, validationWarnings, hasValidationErrors, imageUrlValid };
}

export function handlePostFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    setFormData: React.Dispatch<React.SetStateAction<PostFormData>>
) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
}

export function slugify(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
