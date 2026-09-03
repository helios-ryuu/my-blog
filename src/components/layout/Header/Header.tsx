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
    const isPostEditor = pathname === "/admin/posts/new" || /^\/admin\/posts\/[^/]+\/edit$/.test(pathname);
    const currentRoute = menuItems
        .filter((item) => item.href !== "/" && (pathname === item.href || pathname.startsWith(`${item.href}/`)))
        .sort((a, b) => b.href.length - a.href.length)[0];

    return (
        <header className="relative flex h-10 shrink-0 items-center border-b border-(--border-color) bg-background md:z-40">
            {/* Left: Logo & Breadcrumb */}
            <div className="relative z-10 hidden h-full max-w-[calc(50%-14rem)] shrink-0 items-center text-foreground md:flex">
                <Link href="/" aria-label={SITE_NAME} className="ml-16 mr-2 transition-opacity hover:opacity-75">
                    <Image src="/favicon.ico" alt="" width={24} height={24} className="h-6 w-6" priority />
                </Link>
                {currentRoute && (
                    <>
                        <Slash className="h-4 w-4 shrink-0 text-(--foreground-dim)" />
                        <Link href={currentRoute.href} className="truncate px-2 text-sm text-foreground transition-colors hover:text-accent">
                            {tNav(currentRoute.labelKey)}
                        </Link>
                    </>
                )}
            </div>

            {/* Mobile Left: Logo */}
            <div className="relative z-10 flex h-full min-w-9 shrink-0 items-center pl-2 text-foreground md:hidden">
                <Link href="/" aria-label={SITE_NAME} className="transition-opacity hover:opacity-75">
                    <Image src="/favicon.ico" alt="" width={20} height={20} className="h-5 w-5" priority />
                </Link>
            </div>

            {/* Desktop Center: SearchBar always truly centered on screen */}
            <div className="pointer-events-none absolute inset-0 hidden items-center justify-center px-4 lg:flex">
                <div className="pointer-events-auto w-full max-w-sm lg:max-w-md xl:max-w-140">
                    <SearchBar />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="relative z-10 ml-auto flex h-full shrink-0 items-center justify-end gap-1 pr-2 md:min-w-52 md:gap-2 md:pr-5">
                <div className="flex items-center gap-0.5 md:gap-1">
                    <a
                        href={SOCIAL_LINKS.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-background-hover hover:text-accent"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                    </a>
                    <a
                        href={SOCIAL_LINKS.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-background-hover hover:text-accent"
                    >
                        <svg viewBox="0 0 512 512" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                            <path d="M256 49.471c67.266 0 75.233.257 101.8 1.469 24.562 1.121 37.9 5.224 46.778 8.674a78.052 78.052 0 0 1 28.966 18.845 78.052 78.052 0 0 1 18.845 28.966c3.45 8.877 7.554 22.216 8.674 46.778 1.212 26.565 1.469 34.532 1.469 101.8s-.257 75.233-1.469 101.8c-1.121 24.562-5.225 37.9-8.674 46.778a83.427 83.427 0 0 1-47.811 47.811c-8.877 3.45-22.216 7.554-46.778 8.674-26.56 1.212-34.527 1.469-101.8 1.469s-75.237-.257-101.8-1.469c-24.562-1.121-37.9-5.225-46.778-8.674a78.051 78.051 0 0 1-28.966-18.845 78.053 78.053 0 0 1-18.845-28.966c-3.45-8.877-7.554-22.216-8.674-46.778C49.728 331.239 49.471 323.271 49.471 256s.257-75.233 1.469-101.8c1.121-24.562 5.224-37.9 8.674-46.778a78.052 78.052 0 0 1 18.845-28.966 78.053 78.053 0 0 1 28.966-18.845c8.877-3.45 22.216-7.554 46.778-8.674 26.565-1.212 34.532-1.469 101.8-1.469m0-45.391c-68.418 0-77 .29-103.866 1.516-26.815 1.224-45.127 5.482-61.151 11.71a123.488 123.488 0 0 0-44.62 29.057A123.488 123.488 0 0 0 17.3 90.982C11.077 107.007 6.819 125.319 5.6 152.134 4.369 179 4.079 187.582 4.079 256S4.369 333 5.6 359.866c1.224 26.815 5.482 45.127 11.71 61.151a123.489 123.489 0 0 0 29.057 44.62 123.486 123.486 0 0 0 44.62 29.057c16.025 6.228 34.337 10.486 61.151 11.71 26.87 1.226 35.449 1.516 103.866 1.516s77-.29 103.866-1.516c26.815-1.224 45.127-5.482 61.151-11.71a128.817 128.817 0 0 0 73.677-73.677c6.228-16.025 10.486-34.337 11.71-61.151 1.226-26.87 1.516-35.449 1.516-103.866s-.29-77-1.516-103.866c-1.224-26.815-5.482-45.127-11.71-61.151a123.486 123.486 0 0 0-29.057-44.62A123.487 123.487 0 0 0 421.018 17.3c-16.025-6.228-34.337-10.486-61.151-11.71C333 4.369 324.418 4.079 256 4.079Z"/>
                            <path d="M256 126.635A129.365 129.365 0 1 0 385.365 256 129.365 129.365 0 0 0 256 126.635Zm0 213.338A83.973 83.973 0 1 1 339.974 256 83.974 83.974 0 0 1 256 339.973Z"/>
                            <circle cx="390.476" cy="121.524" r="30.23"/>
                        </svg>
                    </a>
                </div>
                <AuthSection />
                <LanguageSwitcher />
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
