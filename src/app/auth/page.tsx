"use client";

import { Suspense, useEffect, useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useUser } from "@/contexts/UserContext";
import { useTranslations } from "next-intl";
import { startNavigationLoading } from "@/lib/navigation-loading";

export default function AuthPage() {
    return <Suspense fallback={null}><AuthPageInner /></Suspense>;
}

function AuthPageInner() {
    const t = useTranslations("auth");
    const { user, refresh } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const requestedNext = searchParams.get("next");
    const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : "/admin";
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            startNavigationLoading(next);
            router.replace(next);
        }
    }, [next, router, user]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!username.trim() || !password) return;
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), password }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || t("failed"));
            await refresh();
            startNavigationLoading(next);
            router.replace(next);
            router.refresh();
        } catch (error) {
            showToast("error", error instanceof Error ? error.message : t("failed"));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4 py-12">
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
                <header>
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-accent/35 bg-accent/10 text-accent">
                        <LockKeyhole className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl font-semibold">{t("title")}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/55">{t("description")}</p>
                </header>
                <div className="space-y-3">
                    <label className="block text-sm text-foreground/70">
                        {t("username")}
                        <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="mt-1 h-10 w-full rounded border border-(--border-color) bg-background px-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent" required autoFocus />
                    </label>
                    <label className="block text-sm text-foreground/70">
                        {t("password")}
                        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-1 h-10 w-full rounded border border-(--border-color) bg-background px-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent" required />
                    </label>
                </div>
                <button type="submit" disabled={isLoading} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-accent bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">
                    <LogIn className="h-4 w-4" />
                    {isLoading ? t("submitting") : t("submit")}
                </button>
            </form>
        </main>
    );
}
