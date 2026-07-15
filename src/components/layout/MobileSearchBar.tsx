"use client";

import SearchBar from "@/components/layout/Header/SearchBar";

export default function MobileSearchBar() {
    return (
        <div className="md:hidden top-0 z-40 bg-background border-b border-(--border-color)">
            <div className="px-4 py-3">
                <SearchBar />
            </div>
        </div>
    );
}
