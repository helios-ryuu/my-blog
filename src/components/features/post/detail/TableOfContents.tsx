"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
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

    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();

        // Set active immediately on click
        setActiveId(id);
        isClickNavigating.current = true;

        // Scroll to element
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }

        // Re-enable scroll detection after scroll animation completes
        setTimeout(() => {
            isClickNavigating.current = false;
        }, 800);
    }, []);

    if (headings.length === 0) return null;

    return (
        <div className="flex flex-col h-full">
            <h4 className="px-4 text-xs font-semibold text-foreground/70 uppercase tracking-wider border-b border-border/50 py-2 whitespace-nowrap overflow-hidden">
                On this page
            </h4>
            <nav className="pl-4 overflow-y-auto custom-scrollbar flex-1">
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
