"use client";

import { useState } from "react";
import { Check, Plus, Search } from "lucide-react";

interface Tag {
    id: number;
    name: string;
    slug?: string;
}

interface TagSelectorProps {
    tags: Tag[];
    selectedTags: number[];
    maxTags?: number;
    onToggle: (tagId: number) => void;
    onAddNew?: () => void;
}

export function TagSelector({
    tags,
    selectedTags,
    maxTags = 3,
    onToggle,
    onAddNew,
}: TagSelectorProps) {
    const [query, setQuery] = useState("");
    const filtered = tags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-foreground/70">
                    Tags <span className="text-foreground/40">(max {maxTags})</span>
                </label>
                {onAddNew && (
                    <button
                        type="button"
                        onClick={onAddNew}
                        className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors cursor-pointer"
                    >
                        <Plus size={14} />
                        Add New Tag
                    </button>
                )}
            </div>

            {tags.length > 6 && (
                <div className="relative mb-2">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/40" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tags..."
                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-(--border-color) bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                </div>
            )}

            <div className="flex flex-wrap gap-2 p-3 rounded-md border border-(--border-color) bg-foreground/5 min-h-[60px]">
                {filtered.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    const isDisabled = !isSelected && selectedTags.length >= maxTags;
                    return (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => onToggle(tag.id)}
                            disabled={isDisabled}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${isSelected
                                ? "bg-accent text-white cursor-pointer"
                                : isDisabled
                                    ? "bg-foreground/10 text-foreground/30 cursor-not-allowed"
                                    : "bg-foreground/10 text-foreground/70 hover:bg-foreground/20 cursor-pointer"
                                }`}
                        >
                            {isSelected && <Check size={14} />}
                            {tag.name}
                        </button>
                    );
                })}
                {filtered.length === 0 && (
                    <span className="text-foreground/40 text-sm">
                        {tags.length === 0 ? "No tags available" : "No tags match search"}
                    </span>
                )}
            </div>
        </div>
    );
}
