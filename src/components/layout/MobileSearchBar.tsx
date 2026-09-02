"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import SearchBar from "@/components/layout/Header/SearchBar";
import { SlidersHorizontal } from "lucide-react";
import { usePostFilter } from "@/contexts/PostFilterContext";

export default function MobileSearchBar() {
    const { isMobileFilterOpen, setIsMobileFilterOpen } = usePostFilter();
    const pathname = usePathname();
    
    const handleFilterClick = useCallback(() => {
        setIsMobileFilterOpen(!isMobileFilterOpen);
    }, [isMobileFilterOpen, setIsMobileFilterOpen]);

    // Ẩn thanh tìm kiếm trên trang chi tiết bài viết và trang admin
    if (pathname.startsWith("/post/") || pathname.startsWith("/admin")) {
        return null;
    }

    return (
        <div className="md:hidden top-0 z-40 bg-background border-b border-(--border-color)">
            <div className="px-4 py-2 flex items-center gap-4">
                <button
                    type="button"
                    onClick={handleFilterClick}
                    aria-label="Toggle filters"
                    className={`group flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors duration-200 ${isMobileFilterOpen
                        ? "border-accent/50 bg-accent/15"
                        : "border-(--border-color) bg-background-hover hover:border-(--border-color-hover)"
                    }`}
                >
                    <SlidersHorizontal className={`h-4 w-4 shrink-0 transition-colors duration-200 ease-out ${isMobileFilterOpen ? "text-accent" : "text-foreground group-hover:text-accent"}`} />
                </button>
                <div className="flex-1">
                    <SearchBar />
                </div>
            </div>
        </div>
    );
}
