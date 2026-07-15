"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Languages, Check } from "lucide-react";
import { LOCALES, LOCALE_LABELS, LOCALE_COOKIE, type Locale, isLocale } from "@/i18n/config";

function writeLocaleCookie(next: Locale) {
    if (typeof document === "undefined") return;
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export default function LanguageSwitcher() {
    const router = useRouter();
    const current = useLocale();
    const [isPending, startTransition] = useTransition();

    const handleSelect = (next: Locale) => {
        if (next === current) return;
        writeLocaleCookie(next);
        startTransition(() => {
            router.refresh();
        });
    };

    const display = (isLocale(current) ? current : "en").toUpperCase();

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    aria-label="Language"
                    disabled={isPending}
                    className="flex-none inline-flex items-center gap-1 px-1.5 h-8 rounded-md cursor-pointer hover:bg-background-hover text-(--foreground-dim) hover:text-foreground transition-colors text-[11px] font-semibold tracking-wider"
                >
                    <Languages strokeWidth={3} className="w-4 h-4" />
                    <span>{display}</span>
                </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className="z-[60] min-w-[160px] rounded-md border border-(--border-color) bg-background shadow-lg p-1"
                >
                    {LOCALES.map((loc) => {
                        const selected = loc === current;
                        return (
                            <DropdownMenu.Item
                                key={loc}
                                onSelect={() => handleSelect(loc)}
                                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm rounded cursor-pointer outline-none ${
                                    selected
                                        ? "text-accent"
                                        : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                                }`}
                            >
                                <span>{LOCALE_LABELS[loc]}</span>
                                {selected && <Check size={14} />}
                            </DropdownMenu.Item>
                        );
                    })}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
