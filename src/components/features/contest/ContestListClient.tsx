"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import ContestCard from "./ContestCard";
import Select from "@/components/ui/Select";
import type { ContestWithStages } from "@/types/database";

const STATUS_ORDER: Record<string, number> = {
    active: 0,
    closed: 1,
    cancelled: 2,
    draft: 3,
};

interface Props {
    contests: ContestWithStages[];
}

export default function ContestListClient({ contests }: Props) {
    const t = useTranslations("contests");
    const router = useRouter();
    const searchParams = useSearchParams();

    const searchQ = searchParams.get("q") || "";
    const sortVal = searchParams.get("sort") || "newest";

    const [searchInput, setSearchInput] = useState(searchQ);

    function updateUrl(params: { q?: string; sort?: string }) {
        const next = new URLSearchParams();
        const q = params.q !== undefined ? params.q : searchQ;
        const sort = params.sort !== undefined ? params.sort : sortVal;
        if (q) next.set("q", q);
        if (sort && sort !== "newest") next.set("sort", sort);
        const qs = next.toString();
        router.push(qs ? `/contests?${qs}` : "/contests", { scroll: false });
    }

    function handleSearch(value: string) {
        setSearchInput(value);
        updateUrl({ q: value });
    }

    const displayed = useMemo(() => {
        let result = [...contests];

        if (searchQ.trim()) {
            const q = searchQ.trim().toLowerCase();
            result = result.filter((c) => c.title.toLowerCase().includes(q));
        }

        result.sort((a, b) => {
            switch (sortVal) {
                case "oldest":
                    return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
                case "az":
                    return a.title.localeCompare(b.title);
                case "za":
                    return b.title.localeCompare(a.title);
                case "status":
                    return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
                default:
                    return new Date(b.start_at).getTime() - new Date(a.start_at).getTime();
            }
        });

        return result;
    }, [contests, searchQ, sortVal]);

    const hasFilter = !!searchQ || sortVal !== "newest";

    return (
        <>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 mb-6">
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40 pointer-events-none" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder={t("searchPlaceholder")}
                        className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-(--border-color) bg-(--post-card) text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                </div>
                <Select
                    value={sortVal}
                    onValueChange={(v) => updateUrl({ sort: v })}
                    options={[
                        { value: "newest", label: t("sortNewest") },
                        { value: "oldest", label: t("sortOldest") },
                        { value: "az", label: t("sortAZ") },
                        { value: "za", label: t("sortZA") },
                        { value: "status", label: t("sortStatus") },
                    ]}
                    className="text-sm cursor-pointer"
                />
                {hasFilter && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchInput("");
                            router.push("/contests", { scroll: false });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border border-(--border-color) hover:border-accent hover:text-accent transition-colors cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5" />
                        {t("resetFilters")}
                    </button>
                )}
            </div>

            {/* Results */}
            {displayed.length === 0 ? (
                <div className="rounded-[8px] border border-(--border-color) bg-(--post-card) p-8 text-center">
                    <p className="text-sm text-foreground/70">{t("emptyState")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayed.map((c) => (
                        <ContestCard key={c.id} contest={c} />
                    ))}
                </div>
            )}
        </>
    );
}
