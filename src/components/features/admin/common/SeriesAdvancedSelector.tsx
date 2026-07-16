"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AdminSeries } from "@/types/admin";
import EntityCombobox from "./EntityCombobox";

const PAGE_SIZE = 10;

interface SeriesAdvancedSelectorProps {
    value: AdminSeries | null;
    onChange: (series: AdminSeries | null) => void;
}

async function fetchSeries(params: URLSearchParams, signal?: AbortSignal) {
    const response = await fetch(`/api/admin/series?${params}`, { signal });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Unable to load series");
    return result.data as { items: AdminSeries[]; total: number };
}

export default function SeriesAdvancedSelector({ value, onChange }: SeriesAdvancedSelectorProps) {
    const t = useTranslations("admin");
    const [quickQuery, setQuickQuery] = useState("");
    const [quickItems, setQuickItems] = useState<AdminSeries[]>([]);
    const [isQuickLoading, setIsQuickLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [items, setItems] = useState<AdminSeries[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => {
        const controller = new AbortController();
        const timeout = window.setTimeout(async () => {
            setIsQuickLoading(true);
            try {
                const params = new URLSearchParams({ page: "1", pageSize: "8" });
                if (quickQuery.trim()) params.set("q", quickQuery.trim());
                setQuickItems((await fetchSeries(params, controller.signal)).items);
            } catch {
                if (!controller.signal.aborted) setQuickItems([]);
            } finally {
                if (!controller.signal.aborted) setIsQuickLoading(false);
            }
        }, 250);
        return () => { window.clearTimeout(timeout); controller.abort(); };
    }, [quickQuery]);

    useEffect(() => {
        if (!isOpen) return;
        const controller = new AbortController();
        const timeout = window.setTimeout(async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
                if (query.trim()) params.set("q", query.trim());
                const data = await fetchSeries(params, controller.signal);
                setItems(data.items);
                setTotal(data.total);
            } catch {
                if (!controller.signal.aborted) { setItems([]); setTotal(0); }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        }, 250);
        return () => { window.clearTimeout(timeout); controller.abort(); };
    }, [isOpen, page, query]);

    useEffect(() => {
        if (!isOpen) return;
        const close = (event: KeyboardEvent) => event.key === "Escape" && setIsOpen(false);
        document.addEventListener("keydown", close);
        return () => document.removeEventListener("keydown", close);
    }, [isOpen]);

    const select = (series: AdminSeries) => {
        onChange(series);
        setQuickQuery(series.name);
        setIsOpen(false);
    };

    return (
        <>
            <EntityCombobox
                query={quickQuery}
                onQueryChange={(next) => { setQuickQuery(next); if (value && next !== value.name) onChange(null); }}
                options={quickItems.map((series) => ({
                    key: series.id,
                    label: series.name,
                    description: `#${series.id} · /${series.slug} · ${t("seriesPostCount", { count: series.post_count })}`,
                    item: series,
                }))}
                onSelect={select}
                onAdvanced={() => { setQuery(quickQuery); setPage(1); setIsOpen(true); }}
                placeholder={t("selectSeries")}
                advancedLabel={t("advancedSeriesSearch")}
                emptyLabel={t("noMatchingSeries")}
                loadingLabel={t("searchingSeries")}
                isLoading={isQuickLoading}
            />

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && setIsOpen(false)}>
                    <section role="dialog" aria-modal="true" aria-labelledby="series-picker-title" className="flex max-h-[min(680px,calc(100dvh-24px))] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-(--border-color) bg-background shadow-2xl">
                        <header className="flex items-start justify-between gap-4 border-b border-(--border-color) px-4 py-3">
                            <div><h2 id="series-picker-title" className="text-base font-semibold">{t("seriesPickerTitle")}</h2><p className="mt-0.5 text-xs text-foreground/55">{t("seriesPickerDescription")}</p></div>
                            <button type="button" onClick={() => setIsOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/55 hover:bg-foreground/10" aria-label={t("closeSeriesPicker")}><X className="h-4 w-4" /></button>
                        </header>
                        <div className="border-b border-(--border-color) p-4">
                            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" /><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={t("seriesSearchPlaceholder")} className="h-10 w-full rounded-md border border-(--border-color) bg-background-hover/35 pl-9 pr-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent" /></div>
                        </div>
                        <div className="min-h-52 flex-1 overflow-y-auto">
                            {isLoading ? <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-foreground/55"><Loader2 className="h-4 w-4 animate-spin" />{t("searchingSeries")}</div>
                                : items.length === 0 ? <div className="flex min-h-52 items-center justify-center text-sm text-foreground/50">{t("noMatchingSeries")}</div>
                                    : <div className="divide-y divide-(--border-color)">{items.map((series) => <button type="button" key={series.id} onClick={() => select(series)} className={`w-full px-4 py-3 text-left hover:bg-accent/8 ${value?.id === series.id ? "bg-accent/12" : ""}`}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{series.name}</h3><p className="mt-1 truncate font-mono text-xs text-foreground/45">#{series.id} · /{series.slug}</p></div><span className="shrink-0 text-xs text-foreground/50">{t("seriesPostCount", { count: series.post_count })}</span></div>{series.description && <p className="mt-2 line-clamp-2 text-xs text-foreground/60">{series.description}</p>}</button>)}</div>}
                        </div>
                        <footer className="flex items-center justify-between border-t border-(--border-color) px-4 py-3"><p className="text-xs text-foreground/50">{t("seriesPickerResults", { count: total })}</p><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-(--border-color) disabled:opacity-35"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-20 text-center text-xs text-foreground/60">{t("pageOf", { page, total: totalPages })}</span><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || isLoading} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-(--border-color) disabled:opacity-35"><ChevronRight className="h-4 w-4" /></button></div></footer>
                    </section>
                </div>
            )}
        </>
    );
}
