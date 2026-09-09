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
        <div className="flex flex-col gap-1">
            <label className="text-[11px] truncate text-foreground/75" title={label}>{label}</label>
            <div className="flex items-center gap-1.5 rounded-md border border-(--border-color) bg-background p-1">
                <label className="relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded border border-(--border-color)/80">
                    <span className="absolute inset-0.5 rounded-xs" style={{ backgroundColor: value }} />
                    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={7}
                    className="h-6 w-full min-w-0 bg-transparent font-mono text-[11px] uppercase outline-none"
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
        <section className="rounded-xl border border-(--border-color) bg-background/50 backdrop-blur-xs p-5 md:p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-(--border-color)/70">
                <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-accent" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        {t("siteSettingsTitle")}
                    </h2>
                </div>
                <select
                    value={editLang}
                    onChange={(e) => setEditLang(e.target.value as "vi" | "en")}
                    className="h-7 rounded-md border border-(--border-color) bg-background px-2 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer"
                    aria-label={t("bannerEditLang")}
                >
                    {LOCALES.map((l) => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                </select>
            </div>

            {/* ── Accent Color ── */}
            <div className="space-y-3">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-accent" />
                        {t("appearanceTitle")}
                    </h3>
                    <p className="mt-1 text-xs text-foreground/60 leading-relaxed">
                        {t("appearanceDescription")}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-(--border-color) shadow-xs" title={t("accentPickerLabel")}>
                        <span className="absolute inset-1 rounded" style={{ backgroundColor: isValid ? draft : accentColor }} />
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
                        className={`h-9 flex-1 max-w-32 rounded-lg border bg-background px-3 font-mono text-sm uppercase outline-none focus:ring-1 ${isValid ? "border-(--border-color) focus:border-accent focus:ring-accent" : "border-red-500 focus:ring-red-500"}`}
                    />
                    <div className="h-5 w-px bg-(--border-color)/60" />
                    <div className="flex items-center gap-1.5 text-xs font-mono text-foreground/70">
                        <span className="inline-block h-3.5 w-3.5 rounded-full border border-(--border-color)" style={{ backgroundColor: isValid ? draft : accentColor }} />
                        <span className="text-[11px] uppercase">{isValid ? draft : accentColor}</span>
                    </div>
                </div>
            </div>

            {/* ── Banner ── */}
            <div className="space-y-4 pt-4 border-t border-(--border-color)/70">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
                        <Flag className="h-3.5 w-3.5 text-accent" />
                        {t("bannerTitle")}
                    </h3>
                    <p className="mt-1 text-xs text-foreground/60 leading-relaxed">
                        {t("bannerDescription")}
                    </p>
                </div>

                {/* Enabled */}
                <label className="flex items-center gap-2.5 cursor-pointer rounded-lg border border-(--border-color)/60 bg-background/50 p-2.5 hover:bg-background/80 transition-colors">
                    <input
                        type="checkbox"
                        id="banner-enabled"
                        checked={bannerDraft.enabled}
                        onChange={(e) => setBannerDraft({ ...bannerDraft, enabled: e.target.checked })}
                        className="h-4 w-4 rounded border-(--border-color) text-accent focus:ring-accent cursor-pointer"
                    />
                    <span className="text-sm font-medium text-foreground">{t("bannerEnabled")}</span>
                </label>

                {/* Content (locale-aware) */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-foreground/80">{t("bannerContent")}</label>
                    <input
                        value={contentObj[editLang]}
                        onChange={(e) => setBannerDraft({ ...bannerDraft, content: { ...contentObj, [editLang]: e.target.value } })}
                        placeholder="Content (HTML supported)..."
                        className="rounded-lg border border-(--border-color) bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                </div>

                {/* Gradient 3 colors */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-foreground/80">{t("bannerGradient")}</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(["color1", "color2", "color3"] as const).map((key, idx) => (
                            <div key={key} className="flex items-center gap-1.5 rounded-md border border-(--border-color) bg-background p-1">
                                <label className="relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded border border-(--border-color)/80">
                                    <span className="absolute inset-0.5 rounded-xs" style={{ backgroundColor: bannerDraft[key] }} />
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
                                    className="h-6 w-full min-w-0 bg-transparent font-mono text-[11px] uppercase outline-none"
                                    title={`Color ${idx + 1}`}
                                />
                            </div>
                        ))}
                    </div>
                    {/* Live Gradient Preview Strip */}
                    <div
                        className="h-3.5 w-full rounded-md border border-(--border-color)/50 mt-1"
                        style={{
                            background: `linear-gradient(to right, ${bannerDraft.color1}, ${bannerDraft.color2}, ${bannerDraft.color3})`
                        }}
                    />
                </div>

                {/* Button toggle & configuration */}
                <div className="rounded-lg border border-(--border-color)/60 bg-background/30 p-3 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                            type="checkbox"
                            id="banner-has-button"
                            checked={bannerDraft.hasButton}
                            onChange={(e) => setBannerDraft({ ...bannerDraft, hasButton: e.target.checked })}
                            className="h-4 w-4 rounded border-(--border-color) text-accent focus:ring-accent cursor-pointer"
                        />
                        <span className="text-sm font-medium text-foreground">{t("bannerShowButton")}</span>
                    </label>

                    {bannerDraft.hasButton && (
                        <div className="space-y-3 pt-2.5 border-t border-(--border-color)/50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Button label */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] text-foreground/75">{t("bannerButtonText")}</label>
                                    <input
                                        value={buttonTextObj[editLang]}
                                        onChange={(e) => setBannerDraft({ ...bannerDraft, buttonText: { ...buttonTextObj, [editLang]: e.target.value } })}
                                        className="h-8 rounded-md border border-(--border-color) bg-background px-2.5 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                                    />
                                </div>

                                {/* Link URL */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] text-foreground/75">{t("bannerButtonLink")}</label>
                                    <input
                                        value={bannerDraft.buttonLink}
                                        onChange={(e) => setBannerDraft({ ...bannerDraft, buttonLink: e.target.value })}
                                        placeholder="https://..."
                                        className="h-8 rounded-md border border-(--border-color) bg-background px-2.5 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                                    />
                                </div>
                            </div>

                            {/* Color fields */}
                            <div className="grid grid-cols-3 gap-2">
                                <ColorField label={t("bannerButtonBg")} value={bannerDraft.buttonBgColor} onChange={(v) => setBannerDraft({ ...bannerDraft, buttonBgColor: v })} />
                                <ColorField label={t("bannerButtonColor")} value={bannerDraft.buttonTextColor} onChange={(v) => setBannerDraft({ ...bannerDraft, buttonTextColor: v })} />
                                <ColorField label={t("bannerButtonBorder")} value={bannerDraft.buttonBorderColor ?? bannerDraft.buttonBgColor} onChange={(v) => setBannerDraft({ ...bannerDraft, buttonBorderColor: v })} />
                            </div>

                            {/* Background opacity: 60% */}
                            <div className="flex flex-col gap-1 pt-1">
                                <div className="flex items-center justify-between text-xs text-foreground/75">
                                    <span>{t("bannerButtonOpacity")}:</span>
                                    <span className="font-mono font-semibold text-accent">{bannerDraft.buttonOpacity ?? 100}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={bannerDraft.buttonOpacity ?? 100}
                                    onChange={(e) => setBannerDraft({ ...bannerDraft, buttonOpacity: parseInt(e.target.value) })}
                                    className="w-full accent-accent h-1.5 cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Banner height & Cooldown */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-foreground/75">{t("bannerHeight")}</label>
                        <input
                            type="number"
                            min={24}
                            max={200}
                            value={bannerDraft.height}
                            onChange={(e) => setBannerDraft({ ...bannerDraft, height: parseInt(e.target.value) || 40 })}
                            className="h-8 rounded-md border border-(--border-color) bg-background px-2.5 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-foreground/75">{t("bannerCooldown")}</label>
                        <input
                            type="number"
                            min={0}
                            value={bannerDraft.cooldownMinutes}
                            onChange={(e) => setBannerDraft({ ...bannerDraft, cooldownMinutes: parseInt(e.target.value) || 0 })}
                            className="h-8 rounded-md border border-(--border-color) bg-background px-2.5 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                        />
                    </div>
                </div>
            </div>

            {/* ── Save ── */}
            <div className="flex justify-end pt-3 border-t border-(--border-color)/70">
                <button
                    type="button"
                    onClick={save}
                    disabled={isSaving || !isValid}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-accent bg-accent px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-hover hover:shadow-md active:scale-98 disabled:cursor-not-allowed disabled:opacity-45"
                >
                    <Check className="h-4 w-4" />
                    {isSaving ? t("accentSaving") : tCommon("save")}
                </button>
            </div>
        </section>
    );
}
