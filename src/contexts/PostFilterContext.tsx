"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface PostFilterContextType {
    isMobileFilterOpen: boolean;
    setIsMobileFilterOpen: (open: boolean) => void;
}

const PostFilterContext = createContext<PostFilterContextType | undefined>(undefined);

export function PostFilterProvider({ children }: { children: ReactNode }) {
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    return (
        <PostFilterContext.Provider value={{ isMobileFilterOpen, setIsMobileFilterOpen }}>
            {children}
        </PostFilterContext.Provider>
    );
}

export function usePostFilter() {
    const context = useContext(PostFilterContext);
    if (context === undefined) {
        throw new Error("usePostFilter must be used within PostFilterProvider");
    }
    return context;
}
