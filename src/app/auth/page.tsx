"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/Toast";

const USERNAME_RE = /^[A-Za-z0-9_]{6,30}$/;
const PASSWORD_RE = /^\S{8,}$/;

export default function AuthPage() {
    return (
        <Suspense fallback={null}>
            <AuthPageInner />
        </Suspense>
    );
}

function AuthPageInner() {
    const { user, refresh } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const next = searchParams.get("next") ?? "/";
    const errorParam = searchParams.get("error");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const usernameError = username.length > 0 && !USERNAME_RE.test(username) ? "Username chỉ gồm chữ, số, dấu gạch dưới và tối thiểu 6 ký tự." : "";
    const passwordError = password.length > 0 && !PASSWORD_RE.test(password) ? "Password tối thiểu 8 ký tự và không có dấu cách." : "";

    useEffect(() => {
        if (user) router.replace(next);
    }, [user, router, next]);

    useEffect(() => {
        if (errorParam) showToast("error", decodeURIComponent(errorParam));
    }, [errorParam, showToast]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!USERNAME_RE.test(username) || !PASSWORD_RE.test(password)) {
            showToast("warning", "Vui lòng kiểm tra lại username/password.");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const json = await res.json();
            if (!json.success) {
                showToast("error", json.message || "Đăng nhập thất bại.");
                return;
            }
            await refresh();
            router.replace(next);
            router.refresh();
        } catch {
            showToast("error", "Không thể đăng nhập. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold">Đăng nhập</h1>
                    <p className="text-sm text-foreground/60">
                        Sử dụng tài khoản do quản trị viên cấp để tiếp tục.
                    </p>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm text-foreground/70">
                        Username
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            className={`mt-1 w-full rounded-md border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 ${
                                usernameError ? "border-red-500 focus:ring-red-500/50" : "border-(--border-color) focus:ring-accent/50"
                            }`}
                            required
                        />
                        {usernameError && <span className="mt-1 block text-xs text-red-500">{usernameError}</span>}
                    </label>
                    <label className="block text-sm text-foreground/70">
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            className={`mt-1 w-full rounded-md border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 ${
                                passwordError ? "border-red-500 focus:ring-red-500/50" : "border-(--border-color) focus:ring-accent/50"
                            }`}
                            required
                        />
                        {passwordError && <span className="mt-1 block text-xs text-red-500">{passwordError}</span>}
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !!usernameError || !!passwordError}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-md border border-(--border-color) text-sm font-medium hover:bg-foreground/5 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                    {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
            </form>
        </div>
    );
}
