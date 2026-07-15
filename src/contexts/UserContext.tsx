"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { User } from "@/types/user";

interface UserContextValue {
    user: User | null;
    isLoading: boolean;
    refresh: () => Promise<void>;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/me", { cache: "no-store" });
            if (res.ok) {
                const json = await res.json();
                setUser(json.data ?? null);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch {
            // ignore
        }
        setUser(null);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <UserContext.Provider value={{ user, isLoading, refresh, logout }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser(): UserContextValue {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
