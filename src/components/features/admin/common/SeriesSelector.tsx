"use client";

import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { AdminSeries } from "@/types/admin";

interface SeriesSelectorProps {
    series: AdminSeries[];
    value: number | null;
    onChange: (series: AdminSeries | null) => void;
    onCreate: () => void;
}

export default function SeriesSelector({ series, value, onChange, onCreate }: SeriesSelectorProps) {
    const t = useTranslations("admin");
    const selected = series.find((item) => item.id === value) ?? null;
    const [query, setQuery] = useState(selected?.name ?? "");
    const [open, setOpen] = useState(false);
    const options = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        return series.filter((item) => !normalized
            || item.name.toLowerCase().includes(normalized)
            || item.slug.includes(normalized)
            || String(item.id).includes(normalized)).slice(0, 10);
    }, [query, series]);

    return (
        <div className="relative">
            <div className="flex h-10 overflow-hidden rounded-md border border-(--border-color) bg-background focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                    <input
                        value={query}
                        onFocus={() => setOpen(true)}
                        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            if (selected && event.target.value !== selected.name) onChange(null);
                            setOpen(true);
                        }}
                        placeholder={t("selectSeries")}
                        className="h-full w-full bg-transparent pl-9 pr-8 text-sm outline-none placeholder:text-foreground/45"
                    />
                    {selected && (
                        <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => { setQuery(""); onChange(null); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/45 hover:text-foreground"
                            aria-label={t("clearSeries")}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onCreate}
                    className="inline-flex w-10 shrink-0 items-center justify-center border-l border-(--border-color) text-foreground/55 hover:bg-foreground/8 hover:text-accent"
                    aria-label={t("createSeries")}
                    title={t("createSeries")}
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
            {open && (
                <div className="absolute inset-x-0 top-full z-[70] mt-1 max-h-60 overflow-y-auto rounded-md border border-(--border-color) bg-background p-1 shadow-xl">
                    {options.length === 0 ? (
                        <p className="px-3 py-5 text-center text-sm text-foreground/50">{t("noMatchingSeries")}</p>
                    ) : options.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => { setQuery(item.name); onChange(item); setOpen(false); }}
                            className="w-full rounded-md px-3 py-2 text-left hover:bg-foreground/7"
                        >
                            <span className="block truncate text-sm font-medium">{item.name}</span>
                            <span className="block truncate text-xs text-foreground/45">#{item.id} · /{item.slug}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
