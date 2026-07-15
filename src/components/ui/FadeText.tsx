"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface FadeTextProps {
    text: string;
    isVisible: boolean;
    duration?: number;
    className?: string;
}

export default function FadeText({ text, isVisible, duration = 200, className = "" }: FadeTextProps) {
    const [visibleCount, setVisibleCount] = useState(0);
    const visibleCountRef = useRef(visibleCount);

    // Keep ref in sync with state
    useEffect(() => {
        visibleCountRef.current = visibleCount;
    }, [visibleCount]);

    const animate = useCallback((direction: 'in' | 'out') => {
        const intervalTime = duration / text.length;
        let i = visibleCountRef.current;

        const timer = setInterval(() => {
            if (direction === 'in') {
                i++;
                setVisibleCount(i);
                if (i >= text.length) clearInterval(timer);
            } else {
                i--;
                setVisibleCount(i);
                if (i <= 0) clearInterval(timer);
            }
        }, intervalTime);

        return () => clearInterval(timer);
    }, [duration, text.length]);

    useEffect(() => {
        return animate(isVisible ? 'in' : 'out');
    }, [isVisible, animate]);

    return (
        <span
            className={`whitespace-nowrap overflow-hidden ${className}`}
            style={{ width: visibleCount > 0 ? 'auto' : 0 }}
        >
            {text.split("").map((char, index) => (
                <span
                    key={index}
                    style={{ opacity: index < visibleCount ? 1 : 0, transition: 'opacity 0.2s' }}
                >
                    {char}
                </span>
            ))}
        </span>
    );
}
