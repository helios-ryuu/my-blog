"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { menuItems } from "@/config/navigation";
import { COPYRIGHT_YEAR, SITE_NAME, SOCIAL_LINKS } from "@/config/site";
import { useUser } from "@/contexts/UserContext";

export default function Footer({ transparent = false }: { transparent?: boolean }) {
    const t = useTranslations("footer");
    const tNav = useTranslations("nav");
    const { user } = useUser();
    const links = menuItems.filter((item) => !item.requiresAdmin || user?.role === "admin");

    return (
        <footer className={`shrink-0 border-t border-(--border-color) ${transparent ? "bg-transparent" : "bg-background"}`}>
            <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 md:grid-cols-[1.2fr_1fr_1fr]">
                <div>
                    <div className="flex items-center gap-3">
                        <Image src="/favicon.ico" alt="" width={34} height={34} className="h-8 w-8" />
                        <div>
                            <div className="font-semibold text-foreground">{SITE_NAME}</div>
                            <div className="text-xs text-foreground/58">{t("tagline")}</div>
                        </div>
                    </div>
                    <p className="mt-3 max-w-md text-xs leading-relaxed text-foreground/70">
                        {t("copyright", { year: COPYRIGHT_YEAR })}
                    </p>
                </div>

                <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-foreground">{t("navigation")}</h3>
                    <nav className="grid grid-cols-2 gap-1">
                        {links.map((item) => (
                            <Link key={item.href} href={item.href} className="text-sm text-foreground transition-colors hover:text-accent">
                                {tNav(item.labelKey)}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-foreground">{t("contact")}</h3>
                    <a
                        href={SOCIAL_LINKS.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-foreground/70 transition-colors hover:text-accent"
                    >
                        {t("githubProfile")}
                    </a>
                </div>
            </div>
        </footer>
    );
}
