"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { menuItems } from "@/config/navigation";
import { useUser } from "@/contexts/UserContext";

const AUTO_HIDE_DELAY_MS = 2500;
const LEAVE_HIDE_DELAY_MS = 600;

export default function NavigationPanel() {
    const pathname = usePathname();
    const tNav = useTranslations("nav");
    const { user } = useUser();
    const isAdmin = user?.role === "admin";
    const visible = menuItems.filter((item) => !item.requiresAdmin || isAdmin);
    const activeItem = visible
        .filter((item) => item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`))
        .sort((a, b) => b.href.length - a.href.length)[0];

    const [isOpen, setIsOpen] = useState(false);
    const isOpenRef = useRef(false);
    const isHoveringNavRef = useRef(false);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
    const rafRef = useRef<number | null>(null);
    const navRef = useRef<HTMLElement | null>(null);

    const clearHideTimer = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const showPanel = useCallback((autoHideMs?: number) => {
        clearHideTimer();
        if (!isOpenRef.current) {
            isOpenRef.current = true;
            setIsOpen(true);
        }
        if (autoHideMs && !isHoveringNavRef.current) {
            hideTimerRef.current = setTimeout(() => {
                if (!isHoveringNavRef.current) {
                    isOpenRef.current = false;
                    setIsOpen(false);
                }
            }, autoHideMs);
        }
    }, [clearHideTimer]);

    const hidePanel = useCallback((delay = 0) => {
        clearHideTimer();
        if (delay <= 0) {
            isOpenRef.current = false;
            setIsOpen(false);
            return;
        }
        hideTimerRef.current = setTimeout(() => {
            if (!isHoveringNavRef.current) {
                isOpenRef.current = false;
                setIsOpen(false);
            }
        }, delay);
    }, [clearHideTimer]);

    useEffect(() => {
        hidePanel(0);
    }, [pathname, hidePanel]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(min-width: 768px)");

        const handleMouseMove = (e: MouseEvent) => {
            if (!mediaQuery.matches) return;

            if (rafRef.current) return;
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;

                const header = document.querySelector("header");
                const headerRect = header?.getBoundingClientRect();
                if (!headerRect) return;

                const navRect = navRef.current?.getBoundingClientRect();

                const topEdge = Math.max(0, headerRect.top - 5);
                const bottomEdge = isOpenRef.current && navRect
                    ? Math.max(navRect.bottom + 10, headerRect.bottom + 20)
                    : headerRect.bottom + 20;

                const isNear = e.clientY >= topEdge && e.clientY <= bottomEdge;

                if (isNear) {
                    if (isHoveringNavRef.current) {
                        clearHideTimer();
                    } else {
                        showPanel(AUTO_HIDE_DELAY_MS);
                    }
                } else {
                    if (isOpenRef.current && !isHoveringNavRef.current) {
                        hidePanel(LEAVE_HIDE_DELAY_MS);
                    }
                }
            });
        };

        const handleScroll = (e: Event) => {
            if (!mediaQuery.matches) return;
            if (navRef.current?.contains(e.target as Node)) return;
            hidePanel(0);
        };

        const handleMouseLeaveDoc = (e: MouseEvent) => {
            if (!mediaQuery.matches) return;
            if (!e.relatedTarget) {
                hidePanel(300);
            }
        };

        const handleMediaChange = (mq: MediaQueryListEvent) => {
            if (!mq.matches) {
                clearHideTimer();
                isOpenRef.current = false;
                setIsOpen(false);
            }
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
        document.documentElement.addEventListener("mouseleave", handleMouseLeaveDoc);
        mediaQuery.addEventListener("change", handleMediaChange);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("scroll", handleScroll, { capture: true });
            document.documentElement.removeEventListener("mouseleave", handleMouseLeaveDoc);
            mediaQuery.removeEventListener("change", handleMediaChange);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            clearHideTimer();
        };
    }, [clearHideTimer, hidePanel, showPanel]);

    return (
        <div className={`nav-panel-collapsible ${isOpen ? "is-open" : ""}`}>
            <div className="min-h-0 overflow-hidden">
                <nav
                    ref={navRef}
                    onMouseEnter={() => {
                        isHoveringNavRef.current = true;
                        clearHideTimer();
                        showPanel();
                    }}
                    onMouseLeave={() => {
                        isHoveringNavRef.current = false;
                        hidePanel(LEAVE_HIDE_DELAY_MS);
                    }}
                    onFocus={() => showPanel()}
                    onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                            hidePanel(300);
                        }
                    }}
                    className="border-b border-(--border-color) bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
                >
                    <div className="flex w-full overflow-x-auto px-4 py-1 md:px-10">
                        <div className="flex items-center gap-1 md:mx-auto md:justify-center">
                            {visible.map((item) => {
                                const Icon = item.icon;
                                const active = activeItem?.href === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => hidePanel(0)}
                                        className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                                            active
                                                ? "bg-accent/15 text-accent"
                                                : "text-foreground/85 hover:bg-foreground/5 hover:text-foreground"
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" strokeWidth={2.5} />
                                        {tNav(item.labelKey)}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </nav>
            </div>
        </div>
    );
}
