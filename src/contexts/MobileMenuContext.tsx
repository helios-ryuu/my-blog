"use client";

import { createContext, ReactNode, useContext, useState } from "react";

type MobileMenuContextType = {
    isMobileOpen: boolean;
    setIsMobileOpen: (value: boolean) => void;
};

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export function MobileMenuProvider({ children }: { children: ReactNode }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <MobileMenuContext.Provider value={{ isMobileOpen, setIsMobileOpen }}>
            {children}
        </MobileMenuContext.Provider>
    );
}

export function useMobileMenu() {
    const context = useContext(MobileMenuContext);
    if (context === undefined) {
        throw new Error("useMobileMenu must be used within a MobileMenuProvider");
    }
    return context;
}
