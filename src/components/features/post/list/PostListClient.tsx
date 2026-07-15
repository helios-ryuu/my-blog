"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PostCard, PostListItem } from "@/components/features/post";
import Select from "@/components/ui/Select";
import MultiSelect from "@/components/ui/MultiSelect";
import { Button } from "@/components/ui";
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PostMeta, Level } from "@/types/post";
import type { PostCategory } from "@/types/database";

type ViewMode = "card" | "list";

interface PostListClientProps {
    posts: PostMeta[];
    allTags: string[];
    allLevels: Level[];
    allCategories?: PostCategory[];
}

const variants = {
    enter: (_direction: number) => ({
        opacity: 0,
    }),
    center: {
        opacity: 1,
    },
    exit: (_direction: number) => ({
        opacity: 0,
    }),
};

// Helper: Level weight
const getLevelWeight = (level?: Level): number => {
    switch (level) {
        case 'beginner': return 1;
        case 'intermediate': return 2;
        case 'advanced': return 3;
        default: return 0;
    }
};

export default function PostListClient({ posts, allTags, allLevels, allCategories }: PostListClientProps) {
    const t = useTranslations("post");
    const searchParams = useSearchParams();
    const router = useRouter();

    const selectedTags = useMemo(() => {
        const tag = searchParams.get("tag");
        return tag ? tag.split(",").map(s => s.trim()).filter(Boolean) : [];
    }, [searchParams]);

    const selectedLevels = useMemo(() => {
        const l = searchParams.get("level");
        return l ? l.split(",").map(s => s.trim()).filter(Boolean) : [];
    }, [searchParams]);

    const selectedCategory = (searchParams.get("category") || "") as PostCategory | "";
    const selectedSort = searchParams.get("sort") || "newest";
    const viewMode = (searchParams.get("view") as ViewMode) || "card";

    const [currentPage, setCurrentPage] = useState(1);
    const [direction, setDirection] = useState(0);
    const [postsPerPage, setPostsPerPage] = useState(4);
    const [isMobile, setIsMobile] = useState(false);

    // Responsive posts per page and mobile detection
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const mobile = width < 640;
            setIsMobile(mobile);

            if (viewMode === "list") {
                setPostsPerPage(10);
            } else if (mobile) {
                setPostsPerPage(Infinity);
            } else {
                setPostsPerPage(4);
            }
        };

        handleResize();

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [viewMode]);

    const updateUrl = (newParams: Partial<{ tags: string[], levels: string[], category: string, sort: string, view: ViewMode }>) => {
        const tag = newParams.tags !== undefined ? newParams.tags : selectedTags;
        const l = newParams.levels !== undefined ? newParams.levels : selectedLevels;
        const c = newParams.category !== undefined ? newParams.category : selectedCategory;
        const s = newParams.sort !== undefined ? newParams.sort : selectedSort;
        const v = newParams.view !== undefined ? newParams.view : viewMode;

        const params = new URLSearchParams();
        if (tag.length > 0) params.set("tag", tag.join(","));
        if (l.length > 0) params.set("level", l.join(","));
        if (c) params.set("category", c);
        if (s !== "newest") params.set("sort", s);
        if (v !== "card") params.set("view", v);

        const query = params.toString();
        router.push(query ? `/post?${query}` : "/post", { scroll: false });
    };

    const handleTagsChange = (values: string[]) => {
        const newTags = values.includes("") ? [] : values;
        updateUrl({ tags: newTags });
    };

    const handleLevelsChange = (values: string[]) => {
        const newLevels = values.includes("") ? [] : values;
        updateUrl({ levels: newLevels });
    };

    const handleCategoryChange = (value: string) => {
        updateUrl({ category: value });
    };

    const handleSortChange = (value: string) => {
        const newSort = value === "" ? "newest" : value;
        updateUrl({ sort: newSort });
    };

    // Filter and sort posts
    const filteredPosts = useMemo(() => {
        let result = [...posts];

        if (selectedTags.length > 0) {
            result = result.filter((post) =>
                post.tags?.some((tag) =>
                    selectedTags.some((st) => tag.toLowerCase() === st.toLowerCase())
                )
            );
        }
        if (selectedLevels.length > 0) {
            result = result.filter((post) =>
                post.level && selectedLevels.includes(post.level)
            );
        }
        if (selectedCategory) {
            result = result.filter((post) => post.category === selectedCategory);
        }

        result.sort((a, b) => {
            switch (selectedSort) {
                case "newest":
                    return new Date(b.date || '').getTime() - new Date(a.date || '').getTime();
                case "oldest":
                    return new Date(a.date || '').getTime() - new Date(b.date || '').getTime();
                case "a-z":
                    return a.title.localeCompare(b.title);
                case "z-a":
                    return b.title.localeCompare(a.title);
                case "easiest":
                    return getLevelWeight(a.level) - getLevelWeight(b.level);
                case "most-advanced":
                    return getLevelWeight(b.level) - getLevelWeight(a.level);
                default:
                    return 0;
            }
        });

        return result;
    }, [posts, selectedTags, selectedLevels, selectedCategory, selectedSort]);

    const clearFilters = () => {
        updateUrl({ tags: [], levels: [], category: "", sort: "newest" });
    };

    const hasActiveFilters = selectedTags.length > 0 || selectedLevels.length > 0 || selectedCategory !== "" || selectedSort !== "newest";

    const categoryLabel = (c: PostCategory) => {
        const key = `category${c.charAt(0).toUpperCase()}${c.slice(1)}` as "categoryNews" | "categoryAnnouncement" | "categoryTutorial" | "categoryResult";
        return t(key);
    };

    const tagOptions = [
        { value: "", label: t("filterAll") },
        ...allTags.map((tag) => ({ value: tag, label: tag }))
    ];

    const levelOptions = [
        { value: "", label: t("filterAll") },
        ...allLevels.map((level) => ({
            value: level,
            label: level.charAt(0).toUpperCase() + level.slice(1),
        }))
    ];

    const categoryOptions = [
        { value: "", label: t("filterAll") },
        ...((allCategories ?? (["news", "announcement", "tutorial", "result"] as PostCategory[])).map((c) => ({
            value: c,
            label: categoryLabel(c),
        }))),
    ];

    const sortOptions = [
        { value: "newest", label: t("sortNewest") },
        { value: "oldest", label: t("sortOldest") },
        { value: "a-z", label: t("sortAZ") },
        { value: "z-a", label: t("sortZA") },
        { value: "easiest", label: t("sortEasiest") },
        { value: "most-advanced", label: t("sortMostAdvanced") },
    ];

    const viewOptions = [
        { value: "card", label: t("viewCard"), icon: LayoutGrid },
        { value: "list", label: t("viewList"), icon: List },
    ];

    const renderHeader = (label: string) => {
        return (
            <div className="flex items-center gap-1 select-none text-(--foreground-dim)">
                <span>{label}</span>
            </div>
        );
    };

    return (
        <>
            {/* Filters & Sort Bar */}
            <div className="mt-6">
                <div className="grid grid-cols-[1fr_auto] sm:flex sm:flex-row sm:flex-wrap gap-4 items-start sm:items-center">
                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 flex-1">
                        <div className="grid grid-cols-[3.5rem_1fr] sm:flex items-center gap-2">
                            <label className="text-xs text-(--foreground-dim) shrink-0">{t("filterTag")}:</label>
                            <MultiSelect
                                values={selectedTags}
                                onValuesChange={handleTagsChange}
                                options={tagOptions}
                                placeholder={t("filterAll")}
                                className="flex-1 cursor-pointer text-xs"
                                isActive={selectedTags.length > 0}
                            />
                        </div>

                        <div className="grid grid-cols-[3.5rem_1fr] sm:flex items-center gap-2">
                            <label className="text-xs text-(--foreground-dim) shrink-0">{t("filterLevel")}:</label>
                            <MultiSelect
                                values={selectedLevels}
                                onValuesChange={handleLevelsChange}
                                options={levelOptions}
                                placeholder={t("filterAll")}
                                className="flex-1 cursor-pointer text-xs"
                                isActive={selectedLevels.length > 0}
                            />
                        </div>

                        <div className="grid grid-cols-[3.5rem_1fr] sm:flex items-center gap-2">
                            <label className="text-xs text-(--foreground-dim) shrink-0">{t("filterCategory")}:</label>
                            <Select
                                value={selectedCategory}
                                onValueChange={handleCategoryChange}
                                options={categoryOptions}
                                placeholder={t("filterAll")}
                                className="flex-1 cursor-pointer text-xs"
                                isActive={selectedCategory !== ""}
                            />
                        </div>

                        <div className="grid grid-cols-[3.5rem_1fr] sm:flex items-center gap-2">
                            <label className="text-xs text-(--foreground-dim) shrink-0">{t("filterSort")}:</label>
                            <Select
                                value={selectedSort}
                                onValueChange={handleSortChange}
                                options={sortOptions}
                                placeholder={t("sortNewest")}
                                className="flex-1 cursor-pointer text-xs"
                                isActive={selectedSort !== "newest"}
                            />
                        </div>

                        {hasActiveFilters && (
                            <Button
                                onClick={clearFilters}
                                variant="secondary"
                                className="mx-auto sm:mx-0"
                            >
                                {t("resetFilters")}
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto self-end">
                        <div className="flex items-center gap-1.5 text-xs text-(--foreground-dim)">
                            {viewMode === "card" ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                        </div>
                        <Select
                            value={viewMode}
                            onValueChange={(v) => {
                                const newView = v as ViewMode;
                                updateUrl({ view: newView });
                            }}
                            options={viewOptions.map(o => ({ value: o.value, label: o.label }))}
                            placeholder={t("viewCard")}
                            className="cursor-pointer text-xs"
                        />
                    </div>
                </div>
            </div>

            <div className="w-full border-t border-(--foreground-dim)/30 mt-2"></div>

            <p className="mt-2 mb-2 text-xs text-(--foreground-dim)">
                {t("showingCount", { shown: filteredPosts.length, total: posts.length })}
                {selectedCategory && (
                    <> <span className="text-accent">{categoryLabel(selectedCategory)}</span></>
                )}
                {selectedTags.length > 0 && (
                    <> — <span className="text-accent">{selectedTags.join(", ")}</span></>
                )}
                {selectedLevels.length > 0 && (
                    <> — <span className="text-accent">{selectedLevels.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(", ")}</span></>
                )}
            </p>

            {filteredPosts.length === 0 && (
                <p className="mt-10 text-foreground/50">{t("noResults")}</p>
            )}

            <div className={`mt-4 relative overflow-hidden ${!isMobile ? 'min-h-[300px]' : ''}`}>
                {viewMode === "list" ? (
                    <div className="flex flex-col gap-2 overflow-x-auto pb-2">
                        <div className="min-w-[1000px]">
                            <div className="grid grid-cols-[4fr_3fr_90px_80px_95px_120px] gap-4 px-4 py-2 text-xs font-semibold text-(--foreground-dim) border-b border-(--border-color) mb-4">
                                {renderHeader(t("colTitle"))}
                                <span>Tags</span>
                                {renderHeader(t("colDate"))}
                                {renderHeader(t("colRead"))}
                                {renderHeader(t("filterLevel"))}
                                {renderHeader(t("filterCategory"))}
                            </div>
                            <AnimatePresence initial={false} mode="wait" custom={direction}>
                                <motion.div
                                    key={currentPage}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="flex flex-col gap-2"
                                >
                                    {filteredPosts
                                        .slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)
                                        .map((post) => (
                                            <PostListItem
                                                key={post.slug}
                                                slug={post.slug}
                                                image={post.image}
                                                title={post.title}
                                                description={post.description}
                                                date={post.date}
                                                readingTime={post.readingTime}
                                                level={post.level}
                                                tags={post.tags}
                                                category={post.category}
                                                onClick={() => router.push(`/post/${post.slug}`)}
                                            />
                                        ))}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                ) : isMobile ? (
                    <div className="flex flex-col gap-4">
                        {filteredPosts.map((post) => (
                            <PostCard
                                key={post.slug}
                                slug={post.slug}
                                image={post.image}
                                title={post.title}
                                description={post.description}
                                date={post.date}
                                readingTime={post.readingTime}
                                level={post.level}
                                tags={post.tags}
                                category={post.category}
                                onClick={() => router.push(`/post/${post.slug}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <AnimatePresence initial={false} mode="wait" custom={direction}>
                        <motion.div
                            key={currentPage}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
                        >
                            {filteredPosts
                                .slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)
                                .map((post) => (
                                    <PostCard
                                        key={post.slug}
                                        slug={post.slug}
                                        image={post.image}
                                        title={post.title}
                                        description={post.description}
                                        date={post.date}
                                        readingTime={post.readingTime}
                                        level={post.level}
                                        tags={post.tags}
                                        category={post.category}
                                        onClick={() => router.push(`/post/${post.slug}`)}
                                    />
                                ))}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            {filteredPosts.length > postsPerPage && (
                <div className="mt-2 flex items-center justify-center gap-4">
                    <button
                        onClick={() => {
                            setDirection(-1);
                            setCurrentPage((p) => Math.max(1, p - 1));
                        }}
                        disabled={currentPage === 1}
                        className="p-2 rounded-md border border-(--border-color) bg-background-hover hover:bg-accent/20 hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xs text-(--foreground-dim)">
                        {t("pagination", { current: currentPage, total: Math.ceil(filteredPosts.length / postsPerPage) })}
                    </span>
                    <button
                        onClick={() => {
                            setDirection(1);
                            setCurrentPage((p) => Math.min(Math.ceil(filteredPosts.length / postsPerPage), p + 1));
                        }}
                        disabled={currentPage >= Math.ceil(filteredPosts.length / postsPerPage)}
                        className="p-2 rounded-md border border-(--border-color) bg-background-hover hover:bg-accent/20 hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </>
    );
}
