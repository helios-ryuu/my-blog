"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function useResizablePanel(initialRatio = 0.5, minRatio = 0.2) {
    const [ratio, setRatio] = useState(initialRatio);
    const isDragging = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const newRatio = (e.clientX - rect.left) / rect.width;
            setRatio(Math.max(minRatio, Math.min(1 - minRatio, newRatio)));
        };

        const handleMouseUp = () => {
            if (isDragging.current) {
                isDragging.current = false;
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [minRatio]);

    return { ratio, containerRef, handleMouseDown };
}
