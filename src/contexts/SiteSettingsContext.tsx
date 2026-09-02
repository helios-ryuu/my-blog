"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_ACCENT_COLOR, BannerConfig, DEFAULT_BANNER_CONFIG } from "@/config/site";

interface SiteSettingsContextValue {
    accentColor: string;
    setAccentColor: (color: string) => void;
    bannerConfig: BannerConfig;
    setBannerConfig: (config: BannerConfig) => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

function applyAccentColor(color: string) {
    const root = document.documentElement;
    root.style.setProperty("--accent", color);
    root.style.setProperty("--accent-hover", `color-mix(in srgb, ${color} 84%, white)`);
    root.style.setProperty("--chart-1", color);
}

export function SiteSettingsProvider({
    initialAccentColor = DEFAULT_ACCENT_COLOR,
    initialBannerConfig = DEFAULT_BANNER_CONFIG,
    children,
}: {
    initialAccentColor?: string;
    initialBannerConfig?: BannerConfig;
    children: ReactNode;
}) {
    const [accentColor, setAccentColor] = useState(initialAccentColor);
    const [bannerConfig, setBannerConfig] = useState<BannerConfig>(initialBannerConfig);

    useEffect(() => {
        applyAccentColor(accentColor);
    }, [accentColor]);

    const value = useMemo(() => ({ accentColor, setAccentColor, bannerConfig, setBannerConfig }), [accentColor, bannerConfig]);
    return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettingsContextValue {
    const context = useContext(SiteSettingsContext);
    if (!context) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
    return context;
}
