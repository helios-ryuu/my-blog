"use client";

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ThemeProvider } from "next-themes";
import Banner from "@/components/layout/Banner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileSearchBar from "@/components/layout/MobileSearchBar";
import NavigationPanel from "@/components/layout/NavigationPanel";
import PageLoadingShell from "@/components/layout/PageLoadingShell";
import { PixelBlast } from "@/components/ui";
import { ToastProvider } from "@/components/ui/Toast";
import { SiteSettingsProvider, useSiteSettings } from "@/contexts/SiteSettingsContext";
import { UserProvider } from "@/contexts/UserContext";
import { SOCIAL_LINKS as REFERENCE_LINKS } from "@/config/site";
import { NAVIGATION_START_EVENT, startNavigationLoading } from "@/lib/navigation-loading";
import { PostFilterProvider } from "@/contexts/PostFilterContext";

function AppShellContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const tCommon = useTranslations("common");
    const { accentColor } = useSiteSettings();
    const isHomePage = pathname === "/";
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
                <div className="pointer-events-none absolute inset-0 z-0 opacity-65">
                    <PixelBlast
                        variant="square"
                        pixelSize={4}
                        color={accentColor}
                        patternScale={2}
                        patternDensity={0.85}
                        pixelSizeJitter={0.12}
                        enableRipples
                        rippleSpeed={0.4}
                        rippleThickness={0.12}
                        rippleIntensityScale={1.45}
                        speed={0.8}
                        edgeFade={0.24}
                        transparent
                    />
                </div>
            )}

            <div className="relative z-20">
                <Banner
                    id="personal-facebook"
                    gradient="linear-gradient(to right, #f2f536, #ca2800, #ca0000)"
                    content={
                        <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                            <span className="text-xs">{tCommon("bannerText")}</span>
                            <a
                                href={REFERENCE_LINKS.other}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-[7px] border border-yellow-500 bg-yellow-600 px-3 py-0.5 text-xs text-white transition-colors hover:border-yellow-400 hover:bg-yellow-500"
                            >
                                {tCommon("bannerCta")}
                            </a>
                        </div>
                    }
                />
            </div>

            <div className="relative z-10 flex flex-1 flex-col md:min-h-0">
                <Header />
                <NavigationPanel />
                <PostFilterProvider>
                    <MobileSearchBar />
                    <div className="relative flex-1 md:min-h-0">
                        <main className={`h-full overflow-auto ${isHomePage ? "bg-transparent" : "bg-background"}`}>
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
}: {
    children: React.ReactNode;
    initialAccentColor: string;
}) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" storageKey="helios-blog-theme" enableSystem={false}>
            <SiteSettingsProvider initialAccentColor={initialAccentColor}>
                <UserProvider>
                    <ToastProvider>
                        <AppShellContent>{children}</AppShellContent>
                    </ToastProvider>
                </UserProvider>
            </SiteSettingsProvider>
        </ThemeProvider>
    );
}
