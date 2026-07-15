"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type SearchItemType = "home" | "posts" | "contests" | "post" | "contest" | "tag";

interface SearchItem {
    type: SearchItemType;
    title: string;
    path: string;
    description?: string;
    tags?: string[];
}

export default function SearchBar() {
    const t = useTranslations("search");
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [posts, setPosts] = useState<SearchItem[]>([]);
    const [contests, setContests] = useState<SearchItem[]>([]);
    const [tags, setTags] = useState<SearchItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const staticRoutes = useMemo<SearchItem[]>(() => [
        { type: "home", title: t("home"), path: "/" },
        { type: "posts", title: t("allPosts"), path: "/post" },
        { type: "contests", title: t("allContests"), path: "/contests" },
    ], [t]);

    useEffect(() => {
        fetch("/api/search")
            .then((res) => res.json())
            .then((json) => {
                if (json.success) {
                    setPosts(json.data.posts || []);
                    setContests(json.data.contests || []);
                    setTags(json.data.tags || []);
                }
            })
            .catch(console.error);
    }, []);

    const filterResults = useCallback((searchQuery: string) => {
        if (searchQuery.startsWith("#")) {
            const tagQuery = searchQuery.slice(1).toLowerCase().trim();
            if (!tagQuery) return tags;

            const matchingTags = tags.filter((tag) => tag.title.toLowerCase().includes(tagQuery));
            const matchingPosts = posts.filter((post) =>
                post.tags?.some((tag) => tag.toLowerCase().includes(tagQuery)),
            );

            return [...matchingTags, ...matchingPosts];
        }

        const allItems = [...staticRoutes, ...posts, ...contests];
        if (!searchQuery.trim()) return allItems;

        const lowerQuery = searchQuery.toLowerCase();
        return allItems.filter((item) =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.description?.toLowerCase().includes(lowerQuery) ||
            t(`type.${item.type}`).toLowerCase().includes(lowerQuery),
        );
    }, [contests, posts, staticRoutes, tags, t]);

    const results = useMemo(() => filterResults(query), [query, filterResults]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const goToResult = (path: string) => {
        router.push(path);
        setIsOpen(false);
        setQuery("");
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
                break;
            case "ArrowUp":
                event.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                event.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    goToResult(results[selectedIndex].path);
                }
                break;
            case "Escape":
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        if (query.trim()) setIsOpen(true);
    };

    const handleBlur = () => {
        setTimeout(() => {
            setIsFocused(false);
            setQuery("");
            setIsOpen(false);
        }, 150);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setQuery(value);
        setSelectedIndex(-1);
        setIsOpen(!!value.trim());
    };

    return (
        <div className="relative w-full max-w-140">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder=""
                    className="w-full px-4 py-0.5 bg-background-hover/40 border border-(--border-color) rounded-sm text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-left"
                />
                {!isFocused && !query && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none text-(--foreground-dim) text-sm">
                        <Search strokeWidth={3} className="w-4 h-4" />
                        <span className="text-xs">{t("placeholder")}</span>
                    </div>
                )}
            </div>

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-background border border-(--border-color) rounded-lg shadow-lg max-h-80 overflow-y-auto z-50"
                >
                    {results.length > 0 ? (
                        <ul className="py-2">
                            {results.map((item, index) => (
                                <li key={`${item.type}-${item.path}`}>
                                    <button
                                        type="button"
                                        onPointerDown={(event) => {
                                            if (event.pointerType === "mouse" && event.button !== 0) return;
                                            event.preventDefault();
                                            goToResult(item.path);
                                        }}
                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-background-hover transition-colors flex items-center gap-2 ${
                                            selectedIndex === index
                                                ? "bg-background-hover text-accent"
                                                : "text-foreground"
                                        }`}
                                    >
                                        <span className="text-(--foreground-dim) font-medium min-w-[72px]">
                                            {t(`type.${item.type}`)}:
                                        </span>
                                        <span className="truncate">{item.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-4 py-6 text-center text-(--foreground-dim) text-sm">
                            {t("noResults")}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
