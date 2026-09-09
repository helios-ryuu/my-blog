"use client";

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { ThemeProvider } from "next-themes";
import Banner from "@/components/layout/Banner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileSearchBar from "@/components/layout/MobileSearchBar";
import NavigationPanel from "@/components/layout/NavigationPanel";
import PageLoadingShell from "@/components/layout/PageLoadingShell";
import dynamic from "next/dynamic";
import { ToastProvider } from "@/components/ui/Toast";
import { SiteSettingsProvider, useSiteSettings } from "@/contexts/SiteSettingsContext";

const HomeBackground = dynamic(() => import("@/components/ui/HomeBackground"), { ssr: false });
const PostBackground = dynamic(() => import("@/components/ui/PostBackground"), { ssr: false });
import { UserProvider } from "@/contexts/UserContext";
import { DEFAULT_BANNER_CONFIG, type BannerConfig } from "@/config/site";
import { NAVIGATION_START_EVENT, startNavigationLoading } from "@/lib/navigation-loading";
import { PostFilterProvider } from "@/contexts/PostFilterContext";

function AppShellContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const locale = useLocale();
    const { bannerConfig } = useSiteSettings();
    const cfg = bannerConfig || DEFAULT_BANNER_CONFIG;
    const isHomePage = pathname === "/";
    const isPostPage = pathname === "/post";
    const [navigationTarget, setNavigationTarget] = useState<string | null>(null);

    useEffect(() => {
        const handleNavigationStart = (event: Event) => {
            setNavigationTarget((event as CustomEvent<string>).detail);
        };

        window.addEventListener(NAVIGATION_START_EVENT, handleNavigationStart);
        return () => window.removeEventListener(NAVIGATION_START_EVENT, handleNavigationStart);
    }, []);

    useEffect(() => {
        if (navigationTarget === pathname) setNavigationTarget(null);
    }, [navigationTarget, pathname]);

    useEffect(() => {
        if (!navigationTarget) return;
        const timeout = window.setTimeout(() => setNavigationTarget(null), 30_000);
        return () => window.clearTimeout(timeout);
    }, [navigationTarget]);

    function handleClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (!(event.target instanceof Element)) return;

        const link = event.target.closest<HTMLAnchorElement>("a[href]");
        if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
        startNavigationLoading(link.href);
    }

    return (
        <div
            className="relative flex min-h-screen flex-col md:h-screen md:overflow-hidden"
            onClickCapture={handleClickCapture}
        >
            {isHomePage && (
                <div className="pointer-events-none absolute inset-0 z-0">
                    <HomeBackground />
                </div>
            )}
            {isPostPage && (
                <PostBackground />
            )}

            <div className="relative z-20">
                {cfg.enabled && (
                    <Banner
                        id="site-banner"
                        gradient={`linear-gradient(to right, ${cfg.color1}, ${cfg.color2}, ${cfg.color3})`}
                        height={cfg.height}
                        cooldownMinutes={cfg.cooldownMinutes}
                        content={
                            <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                                <span dangerouslySetInnerHTML={{ __html: typeof cfg.content === "object" ? (cfg.content[locale as "vi" | "en"] ?? cfg.content.vi) : cfg.content }} />
                                {cfg.hasButton && (
                                    <a
                                        href={cfg.buttonLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            backgroundColor: `color-mix(in srgb, ${cfg.buttonBgColor} ${cfg.buttonOpacity ?? 100}%, transparent)`,
                                            borderColor: cfg.buttonBorderColor ?? cfg.buttonBgColor,
                                            borderWidth: "1.5px",
                                            color: cfg.buttonTextColor,
                                        }}
                                        className="rounded-[7px] border-[1.5px] px-3 py-0.5 text-xs transition-colors hover:opacity-85"
                                    >
                                        {typeof cfg.buttonText === "object" ? (cfg.buttonText[locale as "vi" | "en"] ?? cfg.buttonText.vi) : cfg.buttonText}
                                    </a>
                                )}
                            </div>
                        }
                    />
                )}
            </div>

            <div className="relative z-10 flex flex-1 flex-col md:min-h-0">
                <div className="relative">
                    <Header />
                    <NavigationPanel floating={isHomePage || isPostPage} />
                </div>
                <PostFilterProvider>
                    <MobileSearchBar />
                    <div className="relative flex-1 md:min-h-0">
                        <main className={`h-full overflow-auto ${isHomePage || isPostPage ? "bg-transparent" : "bg-background"}`}>
                            <div className="flex min-h-full flex-col pb-[env(safe-area-inset-bottom)]">
                                <div className="min-h-0 flex-1">
                                    {navigationTarget ? <PageLoadingShell /> : children}
                                </div>
                                <Footer />
                            </div>
                        </main>
                    </div>
                </PostFilterProvider>
            </div>
        </div>
    );
}

export default function AppShell({
    children,
    initialAccentColor,
    initialBannerConfig,
}: {
    children: React.ReactNode;
    initialAccentColor: string;
    initialBannerConfig?: BannerConfig;
}) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" storageKey="helios-blog-theme" enableSystem={false}>
            <SiteSettingsProvider initialAccentColor={initialAccentColor} initialBannerConfig={initialBannerConfig}>
                <UserProvider>
                    <ToastProvider>
                        <AppShellContent>{children}</AppShellContent>
                    </ToastProvider>
                </UserProvider>
            </SiteSettingsProvider>
        </ThemeProvider>
    );
}
