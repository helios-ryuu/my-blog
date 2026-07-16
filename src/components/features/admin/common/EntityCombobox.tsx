"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";

export interface EntityComboboxOption<T> {
    key: string | number;
    label: string;
    description?: string;
    item: T;
}

interface EntityComboboxProps<T> {
    query: string;
    onQueryChange: (query: string) => void;
    options: EntityComboboxOption<T>[];
    onSelect: (item: T) => void;
    onAdvanced: () => void;
    placeholder: string;
    advancedLabel: string;
    emptyLabel: string;
    loadingLabel: string;
    isLoading?: boolean;
}

export default function EntityCombobox<T>({
    query,
    onQueryChange,
    options,
    onSelect,
    onAdvanced,
    placeholder,
    advancedLabel,
    emptyLabel,
    loadingLabel,
    isLoading = false,
}: EntityComboboxProps<T>) {
    const listboxId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    useEffect(() => {
        const closeOnOutsideClick = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", closeOnOutsideClick);
        return () => document.removeEventListener("mousedown", closeOnOutsideClick);
    }, []);

    const selectOption = (option: EntityComboboxOption<T>) => {
        onSelect(option.item);
        setIsOpen(false);
        setActiveIndex(-1);
    };

    return (
        <div ref={rootRef} className="relative">
            <div className="flex h-10 overflow-hidden rounded-md border border-(--border-color) bg-background transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
                    <input
                        value={query}
                        onFocus={() => setIsOpen(true)}
                        onChange={(event) => {
                            onQueryChange(event.target.value);
                            setActiveIndex(-1);
                            setIsOpen(true);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "ArrowDown") {
                                event.preventDefault();
                                setIsOpen(true);
                                setActiveIndex((index) => Math.min(index + 1, options.length - 1));
                            } else if (event.key === "ArrowUp") {
                                event.preventDefault();
                                setActiveIndex((index) => Math.max(index - 1, 0));
                            } else if (event.key === "Enter" && activeIndex >= 0 && options[activeIndex]) {
                                event.preventDefault();
                                selectOption(options[activeIndex]);
                            } else if (event.key === "Escape") {
                                setIsOpen(false);
                            }
                        }}
                        placeholder={placeholder}
                        role="combobox"
                        aria-expanded={isOpen}
                        aria-controls={listboxId}
                        aria-autocomplete="list"
                        className="h-full w-full bg-transparent pl-9 pr-8 text-sm text-foreground outline-none placeholder:text-foreground/45"
                    />
                    {isLoading && (
                        <Loader2 className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-foreground/40" aria-label={loadingLabel} />
                    )}
                </div>
                <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                        setIsOpen(false);
                        onAdvanced();
                    }}
                    className="inline-flex w-10 shrink-0 cursor-pointer items-center justify-center border-l border-(--border-color) text-foreground/55 transition-colors hover:bg-foreground/8 hover:text-accent"
                    aria-label={advancedLabel}
                    title={advancedLabel}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                </button>
            </div>

            {isOpen && (
                <div
                    id={listboxId}
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-[70] mt-1 max-h-60 overflow-y-auto rounded-md border border-(--border-color) bg-background p-1 shadow-xl"
                >
                    {isLoading && options.length === 0 ? (
                        <p className="px-3 py-5 text-center text-sm text-foreground/50">{loadingLabel}</p>
                    ) : options.length === 0 ? (
                        <p className="px-3 py-5 text-center text-sm text-foreground/50">{emptyLabel}</p>
                    ) : options.map((option, index) => (
                        <button
                            type="button"
                            role="option"
                            aria-selected={index === activeIndex}
                            key={option.key}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectOption(option)}
                            className={`w-full cursor-pointer rounded-md px-3 py-2 text-left transition-colors ${index === activeIndex ? "bg-accent/15" : "hover:bg-foreground/7"}`}
                        >
                            <span className="block truncate text-sm font-medium text-foreground">{option.label}</span>
                            {option.description && <span className="mt-0.5 block truncate text-xs text-foreground/45">{option.description}</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
