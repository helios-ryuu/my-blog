"use client";

import type { ReactNode } from "react";
import { useState, useMemo } from "react";
import { Search, X, Calendar, Filter } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormSelectDropdown } from "./FormFields";
import { useEscapeKey } from "@/hooks/useEscapeKey";

// ─── Types ───────────────────────────────────────────────────────

interface FilterConfig {
    key: string;
    placeholder: string;
    options: { value: string; label: string }[];
}

interface AdvancedSelectorProps<T> {
    /** Items to select from */
    items: T[];
    /** Modal title */
    title: string;
    /** Icon shown in header */
    icon?: LucideIcon;
    /** Unique key extractor */
    getKey: (item: T) => string | number;
    /** Search predicate */
    searchFn: (item: T, query: string) => boolean;
    /** Date extractor for date range filtering (optional) */
    getDate?: (item: T) => string | undefined;
    /** How to render each item in the list */
    renderItem: (item: T) => ReactNode;
    /** Called when an item is selected */
    onSelect: (item: T) => void;
    /** Called when modal is closed */
    onClose: () => void;
    /** Optional extra filter dropdowns (e.g. level, type, status) */
    filters?: FilterConfig[];
    /** Optional filter predicate — receives item + current filter values */
    filterFn?: (item: T, filterValues: Record<string, string>) => boolean;
}

// ─── Component ───────────────────────────────────────────────────

export function AdvancedSelector<T>({
    items,
    title,
    icon: Icon,
    getKey,
    searchFn,
    getDate,
    renderItem,
    onSelect,
    onClose,
    filters = [],
    filterFn,
}: AdvancedSelectorProps<T>) {
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});

    // Close on Escape
    useEscapeKey(onClose);

    const hasActiveFilters =
        searchQuery !== "" ||
        dateFrom !== "" ||
        dateTo !== "" ||
        Object.values(filterValues).some((v) => v !== "" && v !== "all");

    const clearAllFilters = () => {
        setSearchQuery("");
        setDateFrom("");
        setDateTo("");
        setFilterValues({});
    };

    const setFilter = (key: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            // Search
            if (searchQuery && !searchFn(item, searchQuery)) return false;

            // Date range
            if (getDate && (dateFrom || dateTo)) {
                const itemDate = getDate(item);
                if (itemDate) {
                    const d = new Date(itemDate);
                    if (dateFrom && d < new Date(dateFrom)) return false;
                    if (dateTo) {
                        const toDate = new Date(dateTo);
                        toDate.setHours(23, 59, 59, 999);
                        if (d > toDate) return false;
                    }
                }
            }

            // Custom filters
            if (filterFn && !filterFn(item, filterValues)) return false;

            return true;
        });
    }, [items, searchQuery, dateFrom, dateTo, filterValues, searchFn, getDate, filterFn]);

    return (
        <div
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl mx-4 rounded-xl border border-(--border-color) bg-background shadow-2xl flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 pb-3 border-b border-(--border-color)">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="p-2 rounded-lg bg-accent/10">
                                <Icon size={20} className="text-accent" />
                            </div>
                        )}
                        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 space-y-3 border-b border-(--border-color)">
                    {/* Search */}
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-(--border-color) bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Extra filters row */}
                    {filters.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                            <Filter size={16} className="text-foreground/40 mt-2 shrink-0" />
                            {filters.map((f) => (
                                <FormSelectDropdown
                                    key={f.key}
                                    placeholder={f.placeholder}
                                    options={f.options}
                                    value={filterValues[f.key] || ""}
                                    onChange={(val) => setFilter(f.key, val)}
                                    className="flex-1 min-w-[120px]"
                                />
                            ))}
                        </div>
                    )}

                    {/* Date range */}
                    {getDate && (
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-foreground/40 shrink-0" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="flex-1 px-2 py-1.5 text-sm rounded-md border border-(--border-color) bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                            <span className="text-foreground/40 text-sm">to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="flex-1 px-2 py-1.5 text-sm rounded-md border border-(--border-color) bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                        </div>
                    )}

                    {/* Clear filters + Count */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground/50">
                            {filteredItems.length} of {items.length} items
                        </span>
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="text-accent hover:underline text-sm cursor-pointer"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="overflow-y-auto flex-1 p-2">
                    {filteredItems.length === 0 ? (
                        <div className="p-8 text-center text-foreground/50">
                            No items match your filters
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredItems.map((item) => (
                                <button
                                    key={getKey(item)}
                                    onClick={() => onSelect(item)}
                                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                                >
                                    {renderItem(item)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-(--border-color) flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
