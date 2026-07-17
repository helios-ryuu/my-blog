"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Database, FolderOpen, LayoutDashboard, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUser } from "@/contexts/UserContext";
import { startNavigationLoading } from "@/lib/navigation-loading";

export default function AuthSection() {
    const { user, isLoading, logout } = useUser();
    const router = useRouter();
    const t = useTranslations("nav");
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function closeOnOutsideClick(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        }
        document.addEventListener("mousedown", closeOnOutsideClick);
        return () => document.removeEventListener("mousedown", closeOnOutsideClick);
    }, []);

    if (isLoading) return <div className="h-7 w-7 animate-pulse rounded-full bg-foreground/10" />;

    if (!user) {
        return (
            <Link href="/auth" className="rounded-md px-2 py-1 text-sm text-foreground/70 transition-colors hover:bg-accent/10 hover:text-accent">
                {t("signIn")}
            </Link>
        );
    }

    async function handleLogout() {
        setIsOpen(false);
        await logout();
        startNavigationLoading("/");
        router.push("/");
        router.refresh();
    }

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((value) => !value)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-foreground/10"
                aria-label={t("adminMenu")}
            >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--border-color) bg-accent/20 text-sm font-semibold text-accent">
                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                </span>
                <span className="hidden select-none text-sm text-foreground/60 md:block">@{user.username}</span>
                <span className="hidden select-none rounded border border-red-500/60 bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium leading-none text-red-500 md:inline-flex">
                    Admin
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-(--border-color) bg-background py-1 shadow-lg">
                    <Link href="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent/10 hover:text-accent">
                        <LayoutDashboard className="h-4 w-4" />
                        {t("adminWorkspace")}
                    </Link>
                    <Link href="/admin/bucket" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent/10 hover:text-accent">
                        <FolderOpen className="h-4 w-4" />
                        {t("bucket")}
                    </Link>
                    <Link href="/admin/database" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent/10 hover:text-accent">
                        <Database className="h-4 w-4" />
                        {t("database")}
                    </Link>
                    <div className="my-1 border-t border-(--border-color)" />
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10">
                        <LogOut className="h-4 w-4" />
                        {t("signOut")}
                    </button>
                </div>
            )}
        </div>
    );
}
