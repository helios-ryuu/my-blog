"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Banner from "@/components/layout/Banner";
import NavigationPanel from "@/components/layout/NavigationPanel";
import { MobileMenuProvider } from "@/contexts/MobileMenuContext";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/ui/Toast";
import { UserProvider } from "@/contexts/UserContext";
import { Button, PixelBlast } from "@/components/ui";

const BANNER_LINK = {
    app: "facebook",
    facebook: { webUrl: "https://www.facebook.com/toanmohinh.hanoi", appUrl: "fb://page/toanmohinh.hanoi" },
} as const;

function AppShellContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const tCommon = useTranslations("common");
    const isHomePage = pathname === "/";

    return (
        <div className="flex flex-col min-h-screen md:h-screen md:overflow-hidden relative">
            {/* PixelBlast Background - only on home page */}
            {isHomePage && (
                <div className="pointer-events-none absolute inset-0 z-0 opacity-90">
                    <PixelBlast
                        variant="square"
                        pixelSize={4}
                        color="#0e31a3" 
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


            <div className="relative z-10">
                <Banner
                    gradient="linear-gradient(to right, #0bb3f5, #0c5aea, #4724c7)"
                    content={
                        <>
                            <span className="text-xs mr-2">{tCommon("bannerText")}</span>
                            <Button
                                    className="bg-green-600 border-green-500 text-white hover:bg-green-400 hover:border-green-500"
                                    onClick={() => {
                                        const { webUrl, appUrl } = BANNER_LINK[BANNER_LINK.app];
                                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                                        if (isMobile) {
                                            window.location.href = appUrl;
                                            setTimeout(() => window.open(webUrl, "_blank"), 500);
                                        } else {
                                            window.open(webUrl, "_blank");
                                        }
                                    }}
                                >
                                    {tCommon("bannerCta")}
                                </Button>
                        </>
                    }
                    dismissible
                />
            </div>

            {/* Display container - contains header, nav, main */}
            <div className="relative z-10 flex-1 flex flex-col md:min-h-0">
                {/* Header - fixed height */}
                <Header noBorder={false} showMobileMenu={false} transparent={false} isHomePage={isHomePage} />
                <NavigationPanel />

                <div className="relative flex-1 md:min-h-0">
                    <main className={`h-full overflow-auto ${isHomePage ? "bg-transparent" : "bg-background"}`}>
                        <div className="min-h-full flex flex-col pb-[env(safe-area-inset-bottom)]">
                            <div className="flex-1 min-h-0">{children}</div>
                            <Footer transparent={false} />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" storageKey="helios-blog-theme" enableSystem={false}>
            <UserProvider>
                <MobileMenuProvider>
                    <ToastProvider>
                        <AppShellContent>{children}</AppShellContent>
                    </ToastProvider>
                </MobileMenuProvider>
            </UserProvider>
        </ThemeProvider>
    );
}
