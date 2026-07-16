"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PostCard, PostListItem } from "@/components/features/post";
import Select from "@/components/ui/Select";
import MultiSelect from "@/components/ui/MultiSelect";
import { Button } from "@/components/ui";
import { ChevronLeft, ChevronRight, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PostMeta } from "@/types/post";
import {
    POST_LEVELS,
    POST_LEVEL_LABEL_KEYS,
    type DbCategory,
    type PostLevel,
    type PostType,
} from "@/types/database";

type ViewMode = "card" | "list";

interface PostListClientProps {
    posts: PostMeta[];
    allTags: string[];
    allCategories: DbCategory[];
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

export default function PostListClient({ posts, allTags, allCategories }: PostListClientProps) {
    const t = useTranslations("post");
    const searchParams = useSearchParams();
    const router = useRouter();

    const selectedTags = useMemo(() => {
        const tag = searchParams.get("tag");
        return tag ? tag.split(",").map(s => s.trim()).filter(Boolean) : [];
    }, [searchParams]);

    const selectedCategory = searchParams.get("category") || "";
    const selectedLevels = useMemo(() => {
        const level = searchParams.get("level");
        return level ? level.split(",").filter((item): item is PostLevel => POST_LEVELS.includes(item as PostLevel)) : [];
    }, [searchParams]);
    const selectedSort = searchParams.get("sort") || "newest";
    const selectedType = (searchParams.get("type") as PostType | null) || "";
    const viewMode = (searchParams.get("view") as ViewMode) || "card";

    const [currentPage, setCurrentPage] = useState(1);
    const [direction, setDirection] = useState(0);
    const [postsPerPage, setPostsPerPage] = useState(4);
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);

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

    const updateUrl = (newParams: Partial<{ tags: string[], levels: PostLevel[], category: string, type: PostType | "", sort: string, view: ViewMode }>) => {
        const tag = newParams.tags !== undefined ? newParams.tags : selectedTags;
        const levels = newParams.levels !== undefined ? newParams.levels : selectedLevels;
        const c = newParams.category !== undefined ? newParams.category : selectedCategory;
        const s = newParams.sort !== undefined ? newParams.sort : selectedSort;
        const type = newParams.type !== undefined ? newParams.type : selectedType;
        const v = newParams.view !== undefined ? newParams.view : viewMode;

        const params = new URLSearchParams();
        if (tag.length > 0) params.set("tag", tag.join(","));
        if (levels.length > 0) params.set("level", levels.join(","));
        if (c) params.set("category", c);
        if (type) params.set("type", type);
        if (s !== "newest") params.set("sort", s);
        if (v !== "card") params.set("view", v);

        const query = params.toString();
        router.push(query ? `/post?${query}` : "/post", { scroll: false });
    };

    const handleTagsChange = (values: string[]) => {
        const newTags = values.includes("") ? [] : values;
        updateUrl({ tags: newTags });
    };

    const handleCategoryChange = (value: string) => {
        updateUrl({ category: value });
    };

    const handleLevelsChange = (values: string[]) => {
        updateUrl({ levels: values.filter((value): value is PostLevel => POST_LEVELS.includes(value as PostLevel)) });
    };

    const handleSortChange = (value: string) => {
        const newSort = value === "" ? "newest" : value;
        updateUrl({ sort: newSort });
    };

    const handleTypeChange = (value: string) => updateUrl({ type: value as PostType | "" });

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
        if (selectedCategory) {
            result = result.filter((post) => post.category === selectedCategory);
        }
        if (selectedLevels.length > 0) {
            result = result.filter((post) => selectedLevels.includes(post.level));
        }
        if (selectedType) result = result.filter((post) => post.type === selectedType);

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
                case "level-asc":
                    return POST_LEVELS.indexOf(a.level) - POST_LEVELS.indexOf(b.level);
                case "level-desc":
                    return POST_LEVELS.indexOf(b.level) - POST_LEVELS.indexOf(a.level);
                default:
                    return 0;
            }
        });

        return result;
    }, [posts, selectedTags, selectedCategory, selectedLevels, selectedSort, selectedType]);

    const clearFilters = () => {
        updateUrl({ tags: [], levels: [], category: "", type: "", sort: "newest" });
    };

    const hasActiveFilters = selectedTags.length > 0 || selectedLevels.length > 0 || selectedCategory !== "" || selectedType !== "" || selectedSort !== "newest";

    const categoryLabel = (slug: string) => {
        const category = allCategories.find((item) => item.slug === slug);
        return category ? (category.icon ? `${category.icon} ${category.name}` : category.name) : slug;
    };

    const tagOptions = [
        { value: "", label: t("filterAll") },
        ...allTags.map((tag) => ({ value: tag, label: tag }))
    ];

    const categoryOptions = [
        { value: "", label: t("filterAll") },
        ...(allCategories.map((category) => ({
            value: category.slug,
            label: category.icon ? `${category.icon} ${category.name}` : category.name,
        }))),
    ];

    const levelOptions = [
        { value: "", label: t("filterAll") },
        ...POST_LEVELS.map((level) => ({ value: level, label: t(POST_LEVEL_LABEL_KEYS[level]) })),
    ];

    const sortOptions = [
        { value: "newest", label: t("sortNewest") },
        { value: "oldest", label: t("sortOldest") },
        { value: "a-z", label: t("sortAZ") },
        { value: "z-a", label: t("sortZA") },
        { value: "level-asc", label: t("sortEasiest") },
        { value: "level-desc", label: t("sortMostAdvanced") },
    ];

    const typeOptions = [
        { value: "", label: t("filterAll") },
        { value: "standalone", label: t("typeStandalone") },
        { value: "series", label: t("typeSeries") },
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
                <button
                    type="button"
                    onClick={() => setIsMobileControlsOpen((open) => !open)}
                    aria-expanded={isMobileControlsOpen}
                    aria-controls="post-management-controls"
                    className={`group flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors duration-200 sm:hidden ${isMobileControlsOpen
                        ? "border-accent/50 bg-accent/15"
                        : "border-(--border-color) bg-background-hover hover:border-(--border-color-hover)"
                    }`}
                >
                    <SlidersHorizontal className={`h-4 w-4 shrink-0 transition-colors duration-200 ease-out ${isMobileControlsOpen ? "text-accent" : "text-foreground group-hover:text-accent"}`} />
                    <span className={`transition-colors duration-200 ease-out ${isMobileControlsOpen ? "text-accent" : "text-foreground group-hover:text-accent"}`}>{t("managePosts")}</span>
                </button>

                <div
                    id="post-management-controls"
                    className={`${isMobileControlsOpen ? "grid" : "hidden"} grid-cols-1 gap-4 border-b border-(--border-color) py-4 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:border-0 sm:py-0`}
                >
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
                            <label className="text-xs text-(--foreground-dim) shrink-0">{t("filterType")}:</label>
                            <Select
                                value={selectedType}
                                onValueChange={handleTypeChange}
                                options={typeOptions}
                                placeholder={t("filterAll")}
                                className="flex-1 cursor-pointer text-xs"
                                isActive={selectedType !== ""}
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
                                className="w-full sm:mx-0 sm:w-auto"
                            >
                                {t("resetFilters")}
                            </Button>
                        )}
                    </div>

                    <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto sm:self-end">
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
                            className="flex-1 cursor-pointer text-xs sm:flex-none"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-2 hidden w-full border-t border-(--foreground-dim)/30 sm:block"></div>

            <p className="mt-2 mb-2 text-xs text-(--foreground-dim)">
                {t("showingCount", { shown: filteredPosts.length, total: posts.length })}
                {selectedCategory && (
                    <> <span className="text-accent">{categoryLabel(selectedCategory)}</span></>
                )}
                {selectedTags.length > 0 && (
                    <> — <span className="text-accent">{selectedTags.join(", ")}</span></>
                )}
                {selectedLevels.length > 0 && (
                    <> — <span className="text-accent">{selectedLevels.map((level) => t(POST_LEVEL_LABEL_KEYS[level])).join(", ")}</span></>
                )}
            </p>

            {filteredPosts.length === 0 && (
                <p className="mt-10 text-foreground/50">{t("noResults")}</p>
            )}

            <div className={`mt-4 relative overflow-hidden ${!isMobile ? 'min-h-[300px]' : ''}`}>
                {viewMode === "list" ? (
                    <div className="flex flex-col gap-2 overflow-x-auto pb-2">
                        <div className="min-w-[1180px]">
                            <div className="grid grid-cols-[4fr_3fr_90px_90px_120px_120px_120px] gap-4 px-4 py-2 text-xs font-semibold text-(--foreground-dim) border-b border-(--border-color) mb-4">
                                {renderHeader(t("colTitle"))}
                                <span>{t("filterTag")}</span>
                                {renderHeader(t("colDate"))}
                                {renderHeader(t("read"))}
                                {renderHeader(t("level"))}
                                {renderHeader(t("filterType"))}
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
                                                categoryName={post.categoryName}
                                                categoryIcon={post.categoryIcon}
                                                type={post.type}
                                                series={post.series}
                                                seriesOrder={post.seriesOrder}
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
                                categoryName={post.categoryName}
                                categoryIcon={post.categoryIcon}
                                type={post.type}
                                series={post.series}
                                seriesOrder={post.seriesOrder}
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
                                        categoryName={post.categoryName}
                                        categoryIcon={post.categoryIcon}
                                        type={post.type}
                                        series={post.series}
                                        seriesOrder={post.seriesOrder}
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
