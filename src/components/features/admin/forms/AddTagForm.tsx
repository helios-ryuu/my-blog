"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { FormField, FormInput, FormMessage } from "../common/FormFields";
import { Button } from "../common/Button";
import { slugify } from "@/hooks/usePostFormValidation";

interface AddTagFormProps {
    onSuccess: (tag: { id: number; name: string; slug: string }) => void;
    onClose: () => void;
}

export default function AddTagForm({ onSuccess, onClose }: AddTagFormProps) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return setError("Name is required");
        const finalSlug = slug.trim() || slugify(name);
        if (!/^[a-z0-9-]+$/.test(finalSlug)) {
            return setError("Slug must be lowercase letters, digits, or hyphens");
        }

        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), slug: finalSlug }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Failed to create tag");
            onSuccess(json.data);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-lg border border-(--border-color) bg-background p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Add New Tag</h2>
                    <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Name" required>
                        <FormInput
                            name="name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (!slug) setSlug(slugify(e.target.value));
                            }}
                            autoFocus
                        />
                    </FormField>

                    <FormField label="Slug" hint="auto-generated if empty">
                        <FormInput
                            name="slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="vd: toan-cao-cap"
                        />
                    </FormField>

                    {error && <FormMessage type="error" message={error} />}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="cancel" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={isLoading} loadingText="Saving...">
                            Create Tag
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
