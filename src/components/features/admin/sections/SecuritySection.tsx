"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, ShieldAlert, RotateCw, Unlock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/Toast";

interface BlockedIpItem {
    ip: string;
    attemptsCount: number;
    escalationLevel: number;
    lockedUntil: string | null;
    lastAttemptAt: string;
    updatedAt: string;
}

export default function SecuritySection() {
    const t = useTranslations("auth");
    const { showToast } = useToast();
    const [currentIp, setCurrentIp] = useState<string>("");
    const [entries, setEntries] = useState<BlockedIpItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [unblockingIp, setUnblockingIp] = useState<string | null>(null);

    const loadSecurityData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/security/rate-limits");
            const json = await res.json();
            if (json.success && json.data) {
                setCurrentIp(json.data.currentIp || "");
                setEntries(json.data.entries || []);
            }
        } catch {
            // Ignore fetch error
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSecurityData();
    }, [loadSecurityData]);

    const handleUnblock = async (ip: string) => {
        setUnblockingIp(ip);
        try {
            const res = await fetch("/api/admin/security/rate-limits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ip }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to unblock IP");
            }
            showToast("success", t("unblockSuccess", { ip }));
            await loadSecurityData();
        } catch (err) {
            showToast("error", err instanceof Error ? err.message : "Error unblocking IP");
        } finally {
            setUnblockingIp(null);
        }
    };

    const isLockedNow = (lockedUntil: string | null) => {
        if (!lockedUntil) return false;
        return new Date(lockedUntil).getTime() > Date.now();
    };

    const formatRemainingLockTime = (lockedUntil: string | null) => {
        if (!lockedUntil) return "";
        const diffMs = new Date(lockedUntil).getTime() - Date.now();
        if (diffMs <= 0) return "";
        const diffMins = Math.ceil(diffMs / (60 * 1000));
        return `${diffMins}m`;
    };

    return (
        <div className="rounded-xl border border-(--border-color) bg-background/50 backdrop-blur-xs p-5 md:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-(--border-color)/70">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-accent" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        {t("securityTitle")}
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={loadSecurityData}
                    disabled={isLoading}
                    title="Refresh"
                    className="p-1 text-foreground/50 hover:text-foreground transition-colors disabled:opacity-50"
                >
                    <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin text-accent" : ""}`} />
                </button>
            </div>

            <p className="text-xs text-foreground/60 leading-relaxed">
                {t("securityDescription")}
            </p>

            {currentIp && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-foreground/5 text-xs">
                    <span className="text-foreground/60">{t("yourIp")}:</span>
                    <span className="font-mono font-medium text-foreground">{currentIp}</span>
                </div>
            )}

            {entries.length === 0 ? (
                <div className="py-4 text-center text-xs text-foreground/45 border border-dashed border-(--border-color) rounded-lg">
                    {t("noBlockedIps")}
                </div>
            ) : (
                <div className="space-y-2">
                    {entries.map((item) => {
                        const locked = isLockedNow(item.lockedUntil);
                        const remaining = formatRemainingLockTime(item.lockedUntil);
                        return (
                            <div
                                key={item.ip}
                                className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors ${
                                    locked
                                        ? "border-red-500/30 bg-red-500/5 text-red-300"
                                        : "border-(--border-color) bg-background/80 text-foreground"
                                }`}
                            >
                                <div className="space-y-0.5 min-w-0 pr-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-semibold truncate">{item.ip}</span>
                                        {locked ? (
                                            <span className="rounded px-1.5 py-0.5 bg-red-500/20 text-red-400 font-medium text-[10px] flex items-center gap-1">
                                                <ShieldAlert className="h-3 w-3" />
                                                Khóa {remaining}
                                            </span>
                                        ) : (
                                            <span className="rounded px-1.5 py-0.5 bg-amber-500/20 text-amber-300 font-medium text-[10px]">
                                                {item.attemptsCount} lần thử
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-foreground/50">
                                        Cấp độ: {item.escalationLevel} • Thử gần nhất: {new Date(item.lastAttemptAt).toLocaleTimeString()}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleUnblock(item.ip)}
                                    disabled={unblockingIp === item.ip}
                                    className="shrink-0 inline-flex items-center gap-1 rounded border border-(--border-color) bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                                >
                                    <Unlock className="h-3 w-3" />
                                    {unblockingIp === item.ip ? "..." : t("unblock")}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
