"use client";

import { useSyncExternalStore } from "react";

const BANNER_STORAGE_PREFIX = "banner_dismissed_";

export function useBannerVisibility(id: string, cooldownMinutes: number) {
    const subscribe = (callback: () => void) => {
        window.addEventListener("storage", callback);
        return () => window.removeEventListener("storage", callback);
    };

    const getSnapshot = () => {
        const storageKey = `${BANNER_STORAGE_PREFIX}${id}`;
        const dismissedAt = localStorage.getItem(storageKey);

        if (!dismissedAt) return true;

        const cooldownMs = cooldownMinutes * 60 * 1000;
        if (Date.now() - Number(dismissedAt) >= cooldownMs) {
            localStorage.removeItem(storageKey);
            return true;
        }

        return false;
    };

    return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function dismissBanner(id: string) {
    localStorage.setItem(`${BANNER_STORAGE_PREFIX}${id}`, Date.now().toString());
    window.dispatchEvent(new Event("storage"));
}
