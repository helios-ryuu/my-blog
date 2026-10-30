"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, Shield } from "lucide-react";
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
        return null;
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
                className="inline-flex cursor-pointer select-none items-center gap-1.5 rounded border border-red-500/50 bg-red-500/20 px-2 py-0.5 text-xs font-medium leading-normal text-red-500 transition-colors hover:bg-red-500/30"
                aria-label={t("adminMenu")}
            >
                <Shield className="h-3.5 w-3.5 shrink-0" />
                <span>Admin</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-36 rounded-md border border-(--border-color) bg-background py-1 shadow-lg">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-500/10"
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        {t("signOut")}
                    </button>
                </div>
            )}
        </div>
    );
}
