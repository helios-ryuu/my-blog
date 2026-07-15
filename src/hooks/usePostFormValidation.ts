"use client";

import { useState, useEffect, useMemo } from "react";
import { CHAR_LIMITS } from "@/types/admin";
import type { PostCategory } from "@/types/database";

export interface PostFormData {
    title: string;
    slug: string;
    description: string;
    content: string;
    image_url: string;
    category: PostCategory;
    published: boolean;
}

export const INITIAL_POST_FORM_DATA: PostFormData = {
    title: "",
    slug: "",
    description: "",
    content: "",
    image_url: "",
    category: "news",
    published: false,
};

export function usePostFormValidation(
    formData: PostFormData,
    opts?: { existingTitles?: string[]; existingSlugs?: string[] }
) {
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

        if (!formData.title.trim()) errors.title = "Title is required";
        else if (formData.title.length > CHAR_LIMITS.title) {
            errors.title = `Title exceeds ${CHAR_LIMITS.title} characters`;
        }

        if (!formData.slug.trim()) errors.slug = "Slug is required";
        else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            errors.slug = "Slug must be lowercase letters, digits, or hyphens";
        }

        if (!formData.description.trim()) errors.description = "Description is required";
        else if (formData.description.length > CHAR_LIMITS.description) {
            errors.description = `Description exceeds ${CHAR_LIMITS.description} characters`;
        }

        if (!formData.content.trim()) errors.content = "Content is required";

        if (opts?.existingTitles?.some(t => t.toLowerCase() === formData.title.trim().toLowerCase())) {
            errors.title = "This title already exists";
        }
        if (opts?.existingSlugs?.includes(formData.slug.trim())) {
            errors.slug = "This slug already exists";
        }

        return errors;
    }, [formData.title, formData.slug, formData.description, formData.content, opts?.existingTitles, opts?.existingSlugs]);

    const validationWarnings = useMemo(() => {
        const warnings: Record<string, string> = {};
        if (formData.content.length > CHAR_LIMITS.content) {
            warnings.content = `Content exceeds ${CHAR_LIMITS.content} characters`;
        }
        if (!imageUrlValid && formData.image_url) {
            warnings.image_url = "Image URL may be invalid or inaccessible";
        }
        return warnings;
    }, [formData.content, formData.image_url, imageUrlValid]);

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
