"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { menuItems } from "@/config/navigation";
import { useUser } from "@/contexts/UserContext";

interface FooterProps {
    transparent?: boolean;
}

export default function Footer({ transparent = false }: FooterProps) {
    const t = useTranslations("footer");
    const tNav = useTranslations("nav");
    const { user } = useUser();
    const links = menuItems.filter((item) => !item.requiresAdmin || user?.role === "admin");

    return (
        <footer className={`flex-none border-t border-(--border-color) ${transparent ? "bg-transparent" : "bg-background"}`}>
            <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 md:grid-cols-[1.2fr_1fr_1fr]">
                <div>
                    <div className="flex items-center gap-3">
                        <Image src="/favicon.ico" alt="Toán Mô Hình Hà Nội" width={34} height={34} className="h-8 w-8" />
                        <div>
                            <div className="font-semibold text-foreground">Toán Mô Hình Hà Nội</div>
                            <div className="text-xs text-foreground/58">Mathematical Modeling Hanoi</div>
                        </div>
                    </div>
                    <p className="mt-3 max-w-md text-xs leading-relaxed text-foreground">{t("copyright")}</p>
                </div>

                <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-foreground">{t("navigation")}</h3>
                    <div className="grid grid-cols-2 gap-1">
                        {links.map((item) => (
                            <Link key={item.href} href={item.href} className="text-sm text-foreground hover:text-accent">
                                {tNav(item.labelKey)}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-foreground">{t("contact")}</h3>
                    <div className="space-y-1 text-sm text-foreground">
                        <div>{t("contactAddress")}</div>
                        <div>{t("contactInstagram")}</div>
                        <div>{t("contactPhone")}</div>
                        <div>{t("contactEmail")}</div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
