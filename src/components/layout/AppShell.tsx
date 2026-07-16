"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ThemeProvider } from "next-themes";
import Banner from "@/components/layout/Banner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileSearchBar from "@/components/layout/MobileSearchBar";
import NavigationPanel from "@/components/layout/NavigationPanel";
import { PixelBlast } from "@/components/ui";
import { ToastProvider } from "@/components/ui/Toast";
import { SiteSettingsProvider, useSiteSettings } from "@/contexts/SiteSettingsContext";
import { UserProvider } from "@/contexts/UserContext";
import { SOCIAL_LINKS } from "@/config/site";

function AppShellContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const tCommon = useTranslations("common");
    const { accentColor } = useSiteSettings();
    const isHomePage = pathname === "/";

    return (
        <div className="relative flex min-h-screen flex-col md:h-screen md:overflow-hidden">
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
                    gradient="linear-gradient(to right, #f5e50b, #ea8a0c, #c72424)"
                    content={
                        <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                            <span className="text-xs">{tCommon("bannerText")}</span>
                            <a
                                href={SOCIAL_LINKS.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-[7px] border border-green-500 bg-green-600 px-3 py-0.5 text-xs text-white transition-colors hover:border-green-400 hover:bg-green-500"
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
                <MobileSearchBar />
                <div className="relative flex-1 md:min-h-0">
                    <main className={`h-full overflow-auto ${isHomePage ? "bg-transparent" : "bg-background"}`}>
                        <div className="flex min-h-full flex-col pb-[env(safe-area-inset-bottom)]">
                            <div className="min-h-0 flex-1">{children}</div>
                            <Footer />
                        </div>
                    </main>
                </div>
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
