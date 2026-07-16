"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useToast } from "@/components/ui/Toast";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export default function SiteSettingsSection() {
    const t = useTranslations("admin");
    const { accentColor, setAccentColor } = useSiteSettings();
    const { showToast } = useToast();
    const [draft, setDraft] = useState(accentColor);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => setDraft(accentColor), [accentColor]);

    async function save() {
        if (!HEX_COLOR.test(draft)) {
            showToast("warning", t("accentInvalid"));
            return;
        }
        setIsSaving(true);
        try {
            const response = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accentColor: draft }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || t("accentSaveError"));
            setAccentColor(result.data.accentColor);
            setDraft(result.data.accentColor);
            showToast("success", t("accentSaveSuccess"));
        } catch (error) {
            showToast("error", error instanceof Error ? error.message : t("accentSaveError"));
        } finally {
            setIsSaving(false);
        }
    }

    const isValid = HEX_COLOR.test(draft);

    return (
        <section className="mb-8 border-y border-(--border-color) py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-accent" />
                        <h2 className="text-sm font-semibold uppercase tracking-widest">{t("appearanceTitle")}</h2>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/60">{t("appearanceDescription")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded border border-(--border-color)" title={t("accentPickerLabel")}>
                        <span className="absolute inset-1 rounded-sm" style={{ backgroundColor: isValid ? draft : accentColor }} />
                        <input
                            type="color"
                            value={isValid ? draft : accentColor}
                            onChange={(event) => setDraft(event.target.value)}
                            className="absolute inset-0 cursor-pointer opacity-0"
                            aria-label={t("accentPickerLabel")}
                        />
                    </label>
                    <input
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={7}
                        spellCheck={false}
                        aria-label={t("accentHexLabel")}
                        className={`h-9 w-28 rounded border bg-background px-3 font-mono text-sm uppercase outline-none focus:ring-1 ${isValid ? "border-(--border-color) focus:border-accent focus:ring-accent" : "border-red-500 focus:ring-red-500"}`}
                    />
                    <button
                        type="button"
                        onClick={save}
                        disabled={isSaving || !isValid || draft.toLowerCase() === accentColor.toLowerCase()}
                        className="inline-flex h-9 items-center gap-2 rounded border border-accent bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        <Check className="h-4 w-4" />
                        {isSaving ? t("accentSaving") : t("accentSave")}
                    </button>
                </div>
            </div>
        </section>
    );
}
