"use client";

import { useEffect } from "react";

/**
 * Registers an Escape-key listener that calls `handler`.
 * Optionally disabled when `enabled` is false (e.g. during loading).
 */
export function useEscapeKey(handler: () => void, enabled = true) {
    useEffect(() => {
        if (!enabled) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") handler();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [handler, enabled]);
}
