"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
    const t = useTranslations("post");
    const [activeId, setActiveId] = useState<string>("");
    const isClickNavigating = useRef(false);

    // Extract headings from markdown content using useMemo (no setState in effect)
    const headings = useMemo(() => {
        const headingRegex = /^(#{2,3})\s+(.+)$/gm;
        const matches: TocItem[] = [];
        let match;

        while ((match = headingRegex.exec(content)) !== null) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = text
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");

            matches.push({ id, text, level });
        }
        return matches;
    }, [content]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                // Only update from scroll if not currently navigating via click
                if (isClickNavigating.current) return;

                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: "-100px 0% -80% 0%" }
        );

        // Observe all headings
        headings.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [headings]);

    const containerRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);
    const navTimerRef = useRef<NodeJS.Timeout | null>(null);
    const deltaAccumulatorRef = useRef<number>(0);
    const clearDeltaTimerRef = useRef<NodeJS.Timeout | null>(null);
    const activeIdRef = useRef<string>(activeId);

    useEffect(() => {
        activeIdRef.current = activeId;
    }, [activeId]);

    // Keep active TOC item in view within the TOC sidebar without scrolling main/ancestor containers
    useEffect(() => {
        if (!activeId || !navRef.current) return;
        const nav = navRef.current;
        const activeLink = nav.querySelector<HTMLAnchorElement>(`a[href="#${activeId}"]`);
        if (!activeLink) return;

        const navRect = nav.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();

        // Check if link is outside the visible area of the nav element
        if (linkRect.top < navRect.top + 8) {
            nav.scrollTop -= (navRect.top + 8 - linkRect.top);
        } else if (linkRect.bottom > navRect.bottom - 8) {
            nav.scrollTop += (linkRect.bottom - (navRect.bottom - 8));
        }
    }, [activeId]);

    const navigateToHeading = useCallback((targetId: string) => {
        setActiveId(targetId);
        activeIdRef.current = targetId;
        isClickNavigating.current = true;

        if (navTimerRef.current) clearTimeout(navTimerRef.current);

        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        navTimerRef.current = setTimeout(() => {
            isClickNavigating.current = false;
        }, 200);
    }, []);

    const navigateToTop = useCallback(() => {
        setActiveId("");
        activeIdRef.current = "";
        isClickNavigating.current = true;

        if (navTimerRef.current) clearTimeout(navTimerRef.current);

        const main = document.querySelector("main");
        if (main) {
            main.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        navTimerRef.current = setTimeout(() => {
            isClickNavigating.current = false;
        }, 200);
    }, []);

    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        navigateToHeading(id);
    }, [navigateToHeading]);

    // Continuous scroll between headers without any cooldown
    useEffect(() => {
        const container = containerRef.current;
        if (!container || headings.length === 0) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();

            // Reset accumulator when scrolling stops
            if (clearDeltaTimerRef.current) clearTimeout(clearDeltaTimerRef.current);
            clearDeltaTimerRef.current = setTimeout(() => {
                deltaAccumulatorRef.current = 0;
            }, 60);

            deltaAccumulatorRef.current += e.deltaY;

            // Threshold allows immediate reaction while ignoring micro vibrations
            const STEP_THRESHOLD = 20;
            if (Math.abs(deltaAccumulatorRef.current) < STEP_THRESHOLD) {
                return;
            }

            const direction = deltaAccumulatorRef.current > 0 ? 1 : -1;
            deltaAccumulatorRef.current = 0;

            // 1. If currently mid-scroll animation, base next jump on activeIdRef
            let currentIdx = -1;
            if (activeIdRef.current) {
                currentIdx = headings.findIndex((h) => h.id === activeIdRef.current);
            }

            // 2. Otherwise determine current heading based on DOM positions
            if (currentIdx === -1 || !isClickNavigating.current) {
                // Headings rest at ~120px when scrolled to with scroll-margin-top
                const THRESHOLD = 200;
                let reachedIdx = -1;
                for (let i = 0; i < headings.length; i++) {
                    const el = document.getElementById(headings[i].id);
                    if (el) {
                        const top = el.getBoundingClientRect().top;
                        if (top <= THRESHOLD) {
                            reachedIdx = i;
                        } else {
                            break;
                        }
                    }
                }
                if (reachedIdx !== -1) {
                    currentIdx = reachedIdx;
                }
            }

            if (direction > 0) {
                // Scroll down -> jump to next heading
                const nextIdx = Math.min(headings.length - 1, currentIdx + 1);
                if (nextIdx >= 0 && nextIdx < headings.length && nextIdx !== currentIdx) {
                    navigateToHeading(headings[nextIdx].id);
                }
            } else {
                // Scroll up -> jump to previous heading or top
                if (currentIdx > 0) {
                    navigateToHeading(headings[currentIdx - 1].id);
                } else {
                    navigateToTop();
                }
            }
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => {
            container.removeEventListener("wheel", handleWheel);
            if (navTimerRef.current) clearTimeout(navTimerRef.current);
            if (clearDeltaTimerRef.current) clearTimeout(clearDeltaTimerRef.current);
        };
    }, [headings, navigateToHeading, navigateToTop]);

    if (headings.length === 0) return null;

    return (
        <div ref={containerRef} className="flex flex-col h-full select-none">
            <h4 className="px-4 text-xs font-semibold text-foreground/70 uppercase tracking-wider border-b border-border/50 py-2 whitespace-nowrap overflow-hidden">
                {t("onThisPage")}
            </h4>
            <nav ref={navRef} className="pl-4 overflow-y-auto custom-scrollbar flex-1">
                <ul className="space-y-1 mr-2 mb-10 mt-2">
                    {headings.map(({ id, text, level }) => (
                        <li key={id}>
                            <a
                                href={`#${id}`}
                                onClick={(e) => handleClick(e, id)}
                                className={`
                                    block text-xs border-l-2 transition-colors py-0.5
                                    ${level === 3 ? "pl-7" : "pl-2"}
                                    ${activeId === id
                                        ? "border-accent text-accent"
                                        : "border-transparent text-foreground/50 hover:text-foreground hover:border-foreground/30"
                                    }
                                `}
                            >
                                {text}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}
