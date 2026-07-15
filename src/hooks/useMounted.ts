"use client";

import { useSyncExternalStore } from "react";

/**
 * Custom hook for mounted state without setState in useEffect
 * Uses useSyncExternalStore for SSR-safe hydration
 */
export function useMounted() {
    return useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );
}
