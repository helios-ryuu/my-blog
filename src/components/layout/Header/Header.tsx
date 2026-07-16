"use client";

import Image from "next/image";
import Link from "next/link";
import { Moon, Slash, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import AuthSection from "@/components/layout/Header/AuthSection";
import LanguageSwitcher from "@/components/layout/Header/LanguageSwitcher";
import SearchBar from "@/components/layout/Header/SearchBar";
import { IconButton } from "@/components/ui";
import { menuItems } from "@/config/navigation";
import { SITE_NAME, SOCIAL_LINKS } from "@/config/site";
import { useMounted } from "@/hooks";

export default function Header() {
    const mounted = useMounted();
    const pathname = usePathname();
    const tCommon = useTranslations("common");
    const tNav = useTranslations("nav");
    const { resolvedTheme, setTheme } = useTheme();
    const theme = mounted && resolvedTheme === "light" ? "light" : "dark";
    const instagramIcon = theme === "light" ? "/Instagram-black.svg" : "/Instagram-white.svg";
    const isPostEditor = pathname === "/admin/posts/new" || /^\/admin\/posts\/[^/]+\/edit$/.test(pathname);
    const currentRoute = menuItems
        .filter((item) => item.href !== "/" && (pathname === item.href || pathname.startsWith(`${item.href}/`)))
        .sort((a, b) => b.href.length - a.href.length)[0];

    return (
        <header className="relative flex h-10 shrink-0 items-center border-b border-(--border-color) bg-background">
            <div className="hidden h-full w-80 shrink-0 items-center text-foreground md:flex">
                <Link href="/" aria-label={SITE_NAME} className="ml-16 mr-2 transition-opacity hover:opacity-75">
                    <Image src="/favicon.ico" alt="" width={24} height={24} className="h-6 w-6" priority />
                </Link>
                {currentRoute && (
                    <>
                        <Slash className="h-4 w-4 text-(--foreground-dim)" />
                        <Link href={currentRoute.href} className="truncate px-2 text-sm text-foreground transition-colors hover:text-accent">
                            {tNav(currentRoute.labelKey)}
                        </Link>
                    </>
                )}
            </div>

            <div className="flex h-full min-w-9 shrink-0 items-center pl-2 text-foreground md:hidden">
                <Link href="/" aria-label={SITE_NAME} className="transition-opacity hover:opacity-75">
                    <Image src="/favicon.ico" alt="" width={20} height={20} className="h-5 w-5" priority />
                </Link>
            </div>

            <div className="hidden min-w-0 flex-1 justify-center px-4 md:flex">
                <SearchBar />
            </div>

            <div className="ml-auto flex h-full shrink-0 items-center justify-end gap-1 pr-2 md:min-w-52 md:gap-2 md:pr-5">
                <div className="flex items-center gap-0.5 md:gap-1">
                    <a
                        href={SOCIAL_LINKS.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-background-hover hover:text-accent"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                            <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.79 8.43-4.94 8.43-9.94Z" />
                        </svg>
                    </a>
                    <a
                        href={SOCIAL_LINKS.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-background-hover"
                    >
                        <Image src={instagramIcon} alt="" width={20} height={20} className="h-5 w-5" aria-hidden="true" />
                    </a>
                </div>
                <LanguageSwitcher />
                <AuthSection />
                {mounted && !isPostEditor && (
                    <IconButton
                        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                        className={`bg-background-hover text-(--foreground-dim) ${theme === "light" ? "hover:text-blue-500" : "hover:text-yellow-500"}`}
                        aria-label={theme === "light" ? tCommon("useDarkTheme") : tCommon("useLightTheme")}
                    >
                        {theme === "light" ? <Moon strokeWidth={2.5} /> : <Sun strokeWidth={2.5} />}
                    </IconButton>
                )}
            </div>
        </header>
    );
}
