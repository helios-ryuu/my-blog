"use client";

import { useSyncExternalStore } from "react";

const BANNER_STORAGE_PREFIX = "banner_dismissed_";

/**
 * Custom hook to check banner visibility from localStorage
 * Uses useSyncExternalStore for SSR-safe hydration
 */
export function useBannerVisibility(id: string, cooldownMinutes: number) {
    const subscribe = (callback: () => void) => {
        window.addEventListener("storage", callback);
        return () => window.removeEventListener("storage", callback);
    };

    const getSnapshot = () => {
        const storageKey = BANNER_STORAGE_PREFIX + id;
        const dismissedAt = localStorage.getItem(storageKey);

        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const now = Date.now();
            const cooldownMs = cooldownMinutes * 60 * 1000;

            if (now - dismissedTime >= cooldownMs) {
                localStorage.removeItem(storageKey);
                return true;
            }
            return false;
        }
        return true;
    };

    const getServerSnapshot = () => false; // Hidden during SSR

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Dismiss the banner by storing the current timestamp
 */
export function dismissBanner(id: string) {
    const storageKey = BANNER_STORAGE_PREFIX + id;
    localStorage.setItem(storageKey, Date.now().toString());
    // Force a storage event for same-tab updates
    window.dispatchEvent(new Event("storage"));
}
