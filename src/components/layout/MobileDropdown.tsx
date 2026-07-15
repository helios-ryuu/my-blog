"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { menuItems } from "@/config/navigation";
import { useUser } from "@/contexts/UserContext";

export default function MobileDropdown() {
    const { isMobileOpen, setIsMobileOpen } = useMobileMenu();
    const pathname = usePathname();
    const { user } = useUser();
    const isAdmin = user?.role === "admin";
    const visibleItems = menuItems.filter((item) => (!item.requiresAdmin || isAdmin) && !item.desktopOnly);
    const activeItem = visibleItems
        .filter((item) => item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`))
        .sort((a, b) => b.href.length - a.href.length)[0];

    const handleClose = () => setIsMobileOpen(false);

    return (
        <>
            {/* Touch overlay - close on touch outside */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onTouchStart={handleClose}
                    onClick={handleClose}
                />
            )}

            {/* Dropdown menu */}
            <div
                className={`
                    absolute top-full left-0 z-50
                    min-w-44 mt-1 bg-background border border-(--border-color) rounded-lg
                    shadow-lg overflow-hidden origin-top-left
                    ${isMobileOpen
                        ? "scale-100 opacity-100"
                        : "scale-95 opacity-0 pointer-events-none"
                    }
                `}
            >
                <nav className="flex flex-col py-1">
                    {visibleItems.map((item) => {
                        const isActive = activeItem?.href === item.href;
                        const Icon = item.icon;

                        if (item.underDevelopment) {
                            return (
                                <span
                                    key={item.href}
                                    title="Under development"
                                    className="flex items-center gap-3 px-4 py-2 text-foreground/40 cursor-not-allowed"
                                >
                                    <Icon strokeWidth={2.5} className="size-5" />
                                    <span className="font-medium text-sm">{item.label}</span>
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={handleClose}
                                className={`
                                    flex items-center gap-3 px-4 py-2
                                    ${isActive
                                        ? "bg-accent/15 text-accent"
                                        : "text-foreground hover:bg-foreground/5"
                                    }
                                `}
                            >
                                <Icon strokeWidth={2.5} className="size-5" />
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
