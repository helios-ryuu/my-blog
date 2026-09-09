"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { LockKeyhole, LogIn, ShieldAlert, AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useUser } from "@/contexts/UserContext";
import { useTranslations } from "next-intl";
import { startNavigationLoading } from "@/lib/navigation-loading";

export default function AuthPage() {
    return <Suspense fallback={null}><AuthPageInner /></Suspense>;
}

function formatCountdown(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
    const [isLocked, setIsLocked] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (user) {
            startNavigationLoading(next);
            router.replace(next);
        }
    }, [next, router, user]);

    // Initial check to see if current IP is already locked
    useEffect(() => {
        async function checkStatus() {
            try {
                const res = await fetch("/api/auth/login", { method: "GET" });
                const json = await res.json();
                if (json.success && json.data) {
                    if (json.data.isLocked && json.data.remainingSeconds > 0) {
                        setIsLocked(true);
                        setRemainingSeconds(json.data.remainingSeconds);
                    }
                    if (json.data.attemptsRemaining !== undefined) {
                        setAttemptsRemaining(json.data.attemptsRemaining);
                    }
                }
            } catch {
                // Ignore background check error
            }
        }
        checkStatus();
    }, []);

    // Countdown interval when locked
    useEffect(() => {
        if (!isLocked || remainingSeconds <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev <= 1) {
                    setIsLocked(false);
                    setAttemptsRemaining(5);
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isLocked, remainingSeconds]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isLocked || !username.trim() || !password) return;
        setIsLoading(true);
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), password }),
            });
            const result = await response.json();

            if (response.status === 429 || result?.data?.isLocked) {
                setIsLocked(true);
                setRemainingSeconds(result?.data?.remainingSeconds || 900);
                setAttemptsRemaining(0);
                throw new Error(result.message || t("failed"));
            }

            if (!response.ok || !result.success) {
                if (result?.data?.attemptsRemaining !== undefined) {
                    setAttemptsRemaining(result.data.attemptsRemaining);
                }
                throw new Error(result.message || t("failed"));
            }

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

                {/* Lockout Countdown Alert Box */}
                {isLocked && (
                    <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400 backdrop-blur-xs flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-semibold text-red-300">{t("lockedTitle")}</p>
                            <p className="text-xs text-red-400/90 leading-relaxed">{t("lockedDescription")}</p>
                            <div className="font-mono text-lg font-bold text-red-200 tracking-wider pt-1">
                                {formatCountdown(remainingSeconds)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Remaining Attempts Warning */}
                {!isLocked && attemptsRemaining !== null && attemptsRemaining <= 3 && attemptsRemaining > 0 && (
                    <div className="rounded-md border border-amber-500/35 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                        <span>{t("attemptsWarning", { count: attemptsRemaining })}</span>
                    </div>
                )}

                <div className="space-y-3">
                    <label className="block text-sm text-foreground/70">
                        {t("username")}
                        <input
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            autoComplete="username"
                            disabled={isLocked || isLoading}
                            className="mt-1 h-10 w-full rounded border border-(--border-color) bg-background px-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                            required
                            autoFocus
                        />
                    </label>
                    <label className="block text-sm text-foreground/70">
                        {t("password")}
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            disabled={isLocked || isLoading}
                            className="mt-1 h-10 w-full rounded border border-(--border-color) bg-background px-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                            required
                        />
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={isLocked || isLoading}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-accent bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <LogIn className="h-4 w-4" />
                    {isLoading ? t("submitting") : t("submit")}
                </button>
            </form>
        </main>
    );
}
