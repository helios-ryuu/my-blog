"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/layout/PageHeader";

interface FAQItem {
    q: string;
    a: string;
}

function Accordion({ items }: { items: FAQItem[] }) {
    const [open, setOpen] = useState<number | null>(null);

    return (
        <div className="divide-y divide-(--border-color) rounded-[8px] border border-(--border-color) bg-(--post-card) overflow-hidden">
            {items.map((item, i) => (
                <div key={i}>
                    <button
                        type="button"
                        onClick={() => setOpen(open === i ? null : i)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-foreground/5 transition-colors cursor-pointer"
                    >
                        <span>{item.q}</span>
                        {open === i ? (
                            <ChevronUp className="w-4 h-4 shrink-0 text-foreground/50" />
                        ) : (
                            <ChevronDown className="w-4 h-4 shrink-0 text-foreground/50" />
                        )}
                    </button>
                    {open === i && (
                        <div className="px-4 pb-4 text-sm text-foreground/74 leading-relaxed border-t border-(--border-color) pt-3">
                            {item.a}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function FAQPage({ mode = "user" }: { mode?: "user" | "admin" }) {
    const t = useTranslations("faq");
    const items = t.raw(mode === "admin" ? "adminItems" : "userItems") as FAQItem[];

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
            <PageHeader
                title={mode === "admin" ? t("adminPageTitle") : t("pageTitle")}
                description={mode === "admin" ? t("adminPageSubtitle") : t("pageSubtitle")}
                className="mb-0"
            />

            <section>
                <h2 className={`text-sm font-bold tracking-widest uppercase mb-3 ${mode === "admin" ? "text-accent" : "text-foreground/80"}`}>
                    {mode === "admin" ? t("adminSection") : t("userSection")}
                </h2>
                <Accordion items={items} />
            </section>
        </div>
    );
}
