"use client";

import { useEffect, useState } from "react";
import { Check, Flag, Palette } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useToast } from "@/components/ui/Toast";
import { DEFAULT_BANNER_CONFIG, type BannerConfig } from "@/config/site";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const LOCALES = [
    { code: "vi" as const, label: "🇻🇳 Tiếng Việt" },
    { code: "en" as const, label: "🇬🇧 English" },
];

function ColorField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs text-foreground/80">{label}</label>
            <div className="flex items-center gap-2">
                <label className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded border border-(--border-color)">
                    <span className="absolute inset-1 rounded-sm" style={{ backgroundColor: value }} />
                    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={7}
                    className="h-8 flex-1 rounded border border-(--border-color) bg-background px-2 font-mono text-xs uppercase outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
            </div>
        </div>
    );
}

export default function SiteSettingsSection() {
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");
    const { accentColor, setAccentColor, bannerConfig, setBannerConfig } = useSiteSettings();
    const { showToast } = useToast();
    const [draft, setDraft] = useState(accentColor);
    const [bannerDraft, setBannerDraft] = useState<BannerConfig>(bannerConfig ?? DEFAULT_BANNER_CONFIG);
    const [isSaving, setIsSaving] = useState(false);
    const [editLang, setEditLang] = useState<"vi" | "en">("vi");

    useEffect(() => setDraft(accentColor), [accentColor]);
    useEffect(() => setBannerDraft(bannerConfig ?? DEFAULT_BANNER_CONFIG), [bannerConfig]);

    const contentObj = typeof bannerDraft.content === "object" ? bannerDraft.content : { vi: String(bannerDraft.content ?? ""), en: "" };
    const buttonTextObj = typeof bannerDraft.buttonText === "object" ? bannerDraft.buttonText : { vi: String(bannerDraft.buttonText ?? ""), en: "" };

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
                body: JSON.stringify({ accentColor: draft, bannerConfig: bannerDraft }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || t("accentSaveError"));
            setAccentColor(result.data.accentColor);
            setDraft(result.data.accentColor);
            setBannerConfig(result.data.bannerConfig);
            setBannerDraft(result.data.bannerConfig);
            showToast("success", t("bannerSaveSuccess"));
        } catch (error) {
            showToast("error", error instanceof Error ? error.message : t("accentSaveError"));
        } finally {
            setIsSaving(false);
        }
    }

    const isValid = HEX_COLOR.test(draft);

    return (
        <section className="mb-8 border-y border-(--border-color) py-5">
            <div className="flex flex-col gap-6">
                {/* ── Accent Color ── */}
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
                    </div>
                </div>

                {/* ── Banner ── */}
                <div className="border-t border-(--border-color) pt-6">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-accent" />
                            <h2 className="text-sm font-semibold uppercase tracking-widest">{t("bannerTitle")}</h2>
                        </div>
                        <select
                            value={editLang}
                            onChange={(e) => setEditLang(e.target.value as "vi" | "en")}
                            className="h-7 rounded border border-(--border-color) bg-background px-2 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer"
                            aria-label={t("bannerEditLang")}
                        >
                            {LOCALES.map((l) => (
                                <option key={l.code} value={l.code}>{l.label}</option>
                            ))}
                        </select>
                    </div>
                    <p className="mb-4 text-xs leading-relaxed text-foreground/60">{t("bannerDescription")}</p>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Enabled */}
                        <div className="flex items-center gap-2 sm:col-span-2">
                            <input
                                type="checkbox"
                                id="banner-enabled"
                                checked={bannerDraft.enabled}
                                onChange={(e) => setBannerDraft({ ...bannerDraft, enabled: e.target.checked })}
                                className="rounded border-(--border-color) text-accent focus:ring-accent cursor-pointer"
                            />
                            <label htmlFor="banner-enabled" className="text-sm font-medium text-foreground/80 cursor-pointer">{t("bannerEnabled")}</label>
                        </div>

                        {/* Content (locale-aware) */}
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label className="text-sm text-foreground/80">{t("bannerContent")}</label>
                            <input
                                value={contentObj[editLang]}
                                onChange={(e) => setBannerDraft({ ...bannerDraft, content: { ...contentObj, [editLang]: e.target.value } })}
                                className="rounded-md border border-(--border-color) bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                            />
                        </div>

                        {/* Gradient 3 colors */}
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                            <label className="text-sm text-foreground/80">{t("bannerGradient")}</label>
                            <div className="flex flex-wrap items-center gap-3">
                                {(["color1", "color2", "color3"] as const).map((key) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <label className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded border border-(--border-color)">
                                            <span className="absolute inset-1 rounded-sm" style={{ backgroundColor: bannerDraft[key] }} />
                                            <input
                                                type="color"
                                                value={bannerDraft[key]}
                                                onChange={(e) => setBannerDraft({ ...bannerDraft, [key]: e.target.value })}
                                                className="absolute inset-0 cursor-pointer opacity-0"
                                            />
                                        </label>
                                        <input
                                            value={bannerDraft[key]}
                                            onChange={(e) => setBannerDraft({ ...bannerDraft, [key]: e.target.value })}
                                            maxLength={7}
                                            className="h-8 w-24 rounded border border-(--border-color) bg-background px-2 font-mono text-xs uppercase outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Button toggle */}
                        <div className="sm:col-span-2 mt-2 border-t border-(--border-color)/50 pt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="checkbox"
                                    id="banner-has-button"
                                    checked={bannerDraft.hasButton}
                                    onChange={(e) => setBannerDraft({ ...bannerDraft, hasButton: e.target.checked })}
                                    className="rounded border-(--border-color) text-accent focus:ring-accent cursor-pointer"
                                />
                                <label htmlFor="banner-has-button" className="text-sm font-medium text-foreground/80 cursor-pointer">{t("bannerShowButton")}</label>
                            </div>

                            {bannerDraft.hasButton && (
                                <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-(--border-color)/50 bg-foreground/5 p-4">
                                    {/* Button text (locale-aware) */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-foreground/80">{t("bannerButtonText")}</label>
                                        <input
                                            value={buttonTextObj[editLang]}
                                            onChange={(e) => setBannerDraft({ ...bannerDraft, buttonText: { ...buttonTextObj, [editLang]: e.target.value } })}
                                            className="rounded-md border border-(--border-color) bg-background px-3 py-1.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                                        />
                                    </div>

                                    {/* Button link */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-foreground/80">{t("bannerButtonLink")}</label>
                                        <input
                                            value={bannerDraft.buttonLink}
                                            onChange={(e) => setBannerDraft({ ...bannerDraft, buttonLink: e.target.value })}
                                            className="rounded-md border border-(--border-color) bg-background px-3 py-1.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                                        />
                                    </div>

                                    <ColorField label={t("bannerButtonBg")} value={bannerDraft.buttonBgColor} onChange={(v) => setBannerDraft({ ...bannerDraft, buttonBgColor: v })} />
                                    <ColorField label={t("bannerButtonColor")} value={bannerDraft.buttonTextColor} onChange={(v) => setBannerDraft({ ...bannerDraft, buttonTextColor: v })} />
                                    <ColorField label={t("bannerButtonBorder")} value={bannerDraft.buttonBorderColor ?? bannerDraft.buttonBgColor} onChange={(v) => setBannerDraft({ ...bannerDraft, buttonBorderColor: v })} />

                                    {/* Opacity */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs text-foreground/80">
                                            {t("bannerButtonOpacity")}: <span className="font-mono font-medium">{bannerDraft.buttonOpacity ?? 100}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={5}
                                            value={bannerDraft.buttonOpacity ?? 100}
                                            onChange={(e) => setBannerDraft({ ...bannerDraft, buttonOpacity: parseInt(e.target.value) })}
                                            className="w-full accent-accent"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Height */}
                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="text-sm text-foreground/80">{t("bannerHeight")}</label>
                            <input
                                type="number"
                                min={24}
                                max={200}
                                value={bannerDraft.height}
                                onChange={(e) => setBannerDraft({ ...bannerDraft, height: parseInt(e.target.value) || 40 })}
                                className="rounded-md border border-(--border-color) bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                            />
                        </div>

                        {/* Cooldown */}
                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="text-sm text-foreground/80">{t("bannerCooldown")}</label>
                            <input
                                type="number"
                                value={bannerDraft.cooldownMinutes}
                                onChange={(e) => setBannerDraft({ ...bannerDraft, cooldownMinutes: parseInt(e.target.value) || 0 })}
                                className="rounded-md border border-(--border-color) bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Save ── */}
                <div className="flex justify-end pt-2">
                    <button
                        type="button"
                        onClick={save}
                        disabled={isSaving || !isValid}
                        className="inline-flex h-9 items-center gap-2 rounded border border-accent bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        <Check className="h-4 w-4" />
                        {isSaving ? t("accentSaving") : tCommon("save")}
                    </button>
                </div>
            </div>
        </section>
    );
}
