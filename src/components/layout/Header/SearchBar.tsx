"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { startNavigationLoading } from "@/lib/navigation-loading";

type SearchItemType = "home" | "posts" | "post" | "tag";

interface SearchItem {
    type: SearchItemType;
    title: string;
    path: string;
    description?: string;
    tags?: string[];
}

export default function SearchBar() {
    const t = useTranslations("search");
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [items, setItems] = useState<{ posts: SearchItem[]; tags: SearchItem[] }>({ posts: [], tags: [] });
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    const staticRoutes = useMemo<SearchItem[]>(() => [
        { type: "home", title: t("home"), path: "/" },
        { type: "posts", title: t("allPosts"), path: "/post" },
    ], [t]);

    useEffect(() => {
        fetch("/api/search")
            .then((response) => response.json())
            .then((result) => {
                if (result.success) setItems({ posts: result.data.posts || [], tags: result.data.tags || [] });
            })
            .catch(() => undefined);
    }, []);

    const results = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return [];
        if (normalized.startsWith("#")) {
            const tagQuery = normalized.slice(1);
            return [...items.tags, ...items.posts].filter((item) =>
                item.title.toLowerCase().includes(tagQuery) || item.tags?.some((tag) => tag.toLowerCase().includes(tagQuery)),
            );
        }
        return [...staticRoutes, ...items.posts, ...items.tags].filter((item) =>
            item.title.toLowerCase().includes(normalized) || item.description?.toLowerCase().includes(normalized),
        );
    }, [items, query, staticRoutes]);

    const goTo = useCallback((path: string) => {
        startNavigationLoading(path);
        router.push(path);
        setQuery("");
        setIsOpen(false);
    }, [router]);

    useEffect(() => {
        function closeOnOutsideClick(event: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) setIsOpen(false);
        }
        document.addEventListener("mousedown", closeOnOutsideClick);
        return () => document.removeEventListener("mousedown", closeOnOutsideClick);
    }, []);

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedIndex((index) => Math.min(index + 1, results.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedIndex((index) => Math.max(index - 1, -1));
        } else if (event.key === "Enter" && selectedIndex >= 0) {
            event.preventDefault();
            goTo(results[selectedIndex].path);
        } else if (event.key === "Escape") {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    }

    return (
        <div ref={rootRef} className="relative w-full max-w-140">
            <div className="relative">
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setSelectedIndex(-1);
                        setIsOpen(Boolean(event.target.value.trim()));
                    }}
                    onFocus={() => {
                        setIsFocused(true);
                        setIsOpen(Boolean(query.trim()));
                    }}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    aria-label={t("placeholder")}
                    className="w-full rounded-sm border border-(--border-color) bg-background-hover/40 px-4 py-0.5 text-left text-sm text-foreground outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent"
                />
                {!isFocused && !query && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-sm text-(--foreground-dim)">
                        <Search strokeWidth={3} className="h-4 w-4" />
                        <span className="text-xs">{t("placeholder")}</span>
                    </div>
                )}
            </div>
            {isOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-lg border border-(--border-color) bg-background py-2 shadow-lg">
                    {results.length ? results.map((item, index) => (
                        <button
                            key={`${item.type}-${item.path}`}
                            type="button"
                            onPointerDown={(event) => {
                                if (event.pointerType === "mouse" && event.button !== 0) return;
                                event.preventDefault();
                                goTo(item.path);
                            }}
                            className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-background-hover ${selectedIndex === index ? "bg-background-hover text-accent" : "text-foreground"}`}
                        >
                            <span className="min-w-18 shrink-0 font-medium text-(--foreground-dim)">{t(`type.${item.type}`)}:</span>
                            <span className="truncate">{item.title}</span>
                        </button>
                    )) : <p className="px-4 py-6 text-center text-sm text-(--foreground-dim)">{t("noResults")}</p>}
                </div>
            )}
        </div>
    );
}
