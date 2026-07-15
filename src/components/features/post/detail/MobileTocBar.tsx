"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Menu, X, Slash, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface MobileTocBarProps {
    title: string;
    content: string;
}

export default function MobileTocBar({ title, content }: MobileTocBarProps) {
    const [isOpen, setIsOpen] = useState(false);
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
                if (isClickNavigating.current) return;

                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: "-100px 0% -80% 0%" }
        );

        headings.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [headings]);

    const handleTocClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        setActiveId(id);
        setIsOpen(false);
        isClickNavigating.current = true;

        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }

        setTimeout(() => {
            isClickNavigating.current = false;
        }, 800);
    }, []);

    // Title will be truncated by CSS on mobile only

    return (
        <div className="z-40 bg-background border-b border-(--border-color)">
            {/* Bar */}
            <div className="flex items-center md:px-2 px-3.5 gap-2">
                {/* TOC Button - Mobile only */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="lg:hidden relative z-50 ml-0.5 mr-1 rounded hover:bg-background-hover"
                >
                    {isOpen ? <X strokeWidth={2.5} className="w-5 h-5" /> : <Menu strokeWidth={2.5} className="w-5 h-5 text-(--foreground-dim)" />}
                </button>

                {/* Breadcrumb - All screens */}
                <div className="flex items-center gap-1 text-sm md:text-xs overflow-hidden py-1 text-foreground/50">
                    <Link
                        href="/post"
                        className="flex items-center justify-center rounded-sm w-6 h-6 hover:bg-foreground/10 hover:text-foreground transition-colors shrink-0"
                        title="Back to Posts"
                    >
                        <ChevronLeft className="w-4 h-4" strokeWidth={3} />
                    </Link>
                    <Link href="/post" className="hover:text-foreground shrink-0 pl-1">
                        Post
                    </Link>
                    <Slash className="w-3 h-3 text-foreground/30 shrink-0" />
                    <span className="text-foreground truncate md:whitespace-normal md:overflow-visible font-medium">{title}</span>
                </div>
            </div>

            {/* Dropdown TOC */}
            {isOpen && (
                <>
                    {/* Dim overlay */}
                    <div
                        className="absolute top-0 left-0 w-screen h-screen z-40"
                        onTouchStart={() => setIsOpen(false)}
                    />

                    {/* TOC Panel */}
                    <div className="absolute left-0 right-0 bg-background border-b border-(--border-color) z-50 max-h-[60vh] overflow-y-auto">
                        <nav className="p-4">
                            <h4 className="text-sm font-semibold text-foreground/70 mb-3 uppercase tracking-wider">
                                On this page
                            </h4>
                            <ul className="space-y-1">
                                {headings.map(({ id, text, level }) => (
                                    <li key={id}>
                                        <a
                                            href={`#${id}`}
                                            onClick={(e) => handleTocClick(e, id)}
                                            className={`
                                                block text-sm py-1 px-3 rounded-md
                                                ${level === 3 ? "ml-6" : ""}
                                                ${activeId === id
                                                    ? "bg-accent/20 text-accent"
                                                    : "text-foreground/70 hover:bg-foreground/5"
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
                </>
            )}
        </div>
    );
}
