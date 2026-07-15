"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { menuItems } from "@/config/navigation";
import { useUser } from "@/contexts/UserContext";

export default function NavigationPanel() {
    const pathname = usePathname();
    const tNav = useTranslations("nav");
    const { user } = useUser();
    const isAdmin = user?.role === "admin";
    const visible = menuItems.filter((item) => !item.requiresAdmin || isAdmin);
    const activeItem = visible
        .filter((item) => item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`))
        .sort((a, b) => b.href.length - a.href.length)[0];

    return (
        <nav className="border-b border-(--border-color) bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 py-2">
                {visible.map((item) => {
                    const Icon = item.icon;
                    const active = activeItem?.href === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                                active
                                    ? "bg-accent/15 text-accent"
                                    : "text-foreground/65 hover:bg-foreground/5 hover:text-foreground"
                            }`}
                        >
                            <Icon className="h-4 w-4" strokeWidth={2.5} />
                            {tNav(item.labelKey)}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
