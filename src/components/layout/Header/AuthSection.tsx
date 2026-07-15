"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { LogOut, Trophy, User } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useTranslations } from "next-intl";

export default function AuthSection() {
    const { user, isLoading, logout } = useUser();
    const router = useRouter();
    const tNav = useTranslations("nav");
    const tMyContests = useTranslations("myContests");
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (isLoading) {
        return <div className="w-7 h-7 rounded-full bg-foreground/10 animate-pulse" />;
    }

    if (!user) {
        return (
            <Link
                href="/auth"
                className="text-sm text-foreground/70 hover:text-accent transition-colors px-2 py-1 rounded-md hover:bg-accent/10"
            >
                {tNav("signIn")}
            </Link>
        );
    }

    const initial = (user.full_name || user.username).charAt(0).toUpperCase();

    async function handleLogout() {
        setIsOpen(false);
        await logout();
        router.push("/");
    }

    return (
        <div ref={dropdownRef} className="relative">
            {/* Combined username + avatar trigger */}
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-foreground/10 transition-colors cursor-pointer"
                aria-label="User menu"
            >
                <div className="w-7 h-7 rounded-full overflow-hidden border border-(--border-color) bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent flex-shrink-0">
                    {initial}
                </div>
                <span className="hidden md:block text-sm text-foreground/60 select-none">
                    @{user.username}
                </span>
                {user.role === "admin" && (
                    <span className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border border-red-500/60 bg-red-500/20 text-red-500 select-none leading-none">
                        Admin
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-md border border-(--border-color) bg-background shadow-lg py-1 z-50">
                    <Link
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:text-accent hover:bg-accent/10 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <User size={14} />
                        {tNav("profile")}
                    </Link>
                    {user.role !== "admin" && (
                        <Link
                            href="/profile/contests"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:text-accent hover:bg-accent/10 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <Trophy size={14} />
                            {tMyContests("pageTitle")}
                        </Link>
                    )}
                    <div className="border-t border-(--border-color) my-1" />
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={14} />
                        {tNav("signOut")}
                    </button>
                </div>
            )}
        </div>
    );
}
