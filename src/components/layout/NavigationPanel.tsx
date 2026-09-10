"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { menuItems } from "@/config/navigation";
import { useUser } from "@/contexts/UserContext";
import SpecularButton from "@/components/ui/SpecularButton";

const AUTO_HIDE_DELAY_MS = 2500;
const LEAVE_HIDE_DELAY_MS = 600;

interface NavigationPanelProps {
    className?: string;
    floating?: boolean;
}

export default function NavigationPanel({ className = "", floating = true }: NavigationPanelProps = {}) {
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
    const activeItemRef = useRef<HTMLAnchorElement | null>(null);

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
        if (typeof window !== "undefined" && window.innerWidth < 768 && activeItemRef.current) {
            activeItemRef.current.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
            });
        }
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
        <div
            className={`nav-panel-collapsible ${isOpen ? "is-open" : ""} ${
                floating
                    ? "px-3 py-1.5 z-[100] md:p-0 md:absolute md:top-full md:left-1/2 md:-translate-x-1/2 md:z-[100] md:w-max md:max-w-[calc(100vw-2rem)] md:pt-2 md:pb-2"
                    : "z-[100]"
            } ${className}`}
        >
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
                    className={
                        floating
                            ? "rounded-[14px] border border-(--border-color) bg-background/85 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-background/75 px-3 py-2 w-max max-w-full mx-auto"
                            : "border-b border-(--border-color) bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 px-4 py-1"
                    }
                >
                    <div className="flex items-center gap-1.5 md:gap-2 whitespace-nowrap overflow-x-auto no-scrollbar md:overflow-visible px-0.5">
                        {visible.map((item) => {
                            const Icon = item.icon;
                            const active = activeItem?.href === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    ref={active ? activeItemRef : undefined}
                                    href={item.href}
                                    onClick={() => hidePanel(0)}
                                    className="inline-flex shrink-0"
                                >
                                    <SpecularButton
                                        size="xs"
                                        radius={8}
                                        active={active}
                                        tint={active ? "var(--accent)" : "currentColor"}
                                        tintOpacity={active ? 0.18 : 0.05}
                                        className={`text-xs font-medium transition-colors ${
                                            active
                                                ? "text-accent font-semibold"
                                                : "text-foreground/80 hover:text-foreground"
                                        }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                                        <span>{tNav(item.labelKey)}</span>
                                    </SpecularButton>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </div>
    );
}
