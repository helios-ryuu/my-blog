"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Calendar, Upload, CheckCircle2 } from "lucide-react";
import type { ContestWithStages, DbContestStage } from "@/types/database";

function formatDateTime(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

function pct(start: number, end: number, t: number): number {
    if (end <= start) return 0;
    return Math.max(0, Math.min(100, ((t - start) / (end - start)) * 100));
}

function isActive(s: DbContestStage, now: number): boolean {
    return new Date(s.start_at).getTime() <= now && now <= new Date(s.end_at).getTime();
}

export default function ContestStageTimeline({
    contest,
    showCurrentStatus = true,
    submissionCtaHref,
}: {
    contest: ContestWithStages;
    showCurrentStatus?: boolean;
    submissionCtaHref?: string;
}) {
    const t = useTranslations("contests");
    const [now, setNow] = useState<number | null>(null);
    useEffect(() => {
        const tick = () => setNow(Date.now());
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const stages = contest.stages ?? [];
    if (stages.length === 0) {
        return (
            <p className="text-sm text-foreground/70 italic">
                {t("stagesEmpty")}
            </p>
        );
    }

    const grandStart = new Date(contest.start_at).getTime();
    const grandEnd = new Date(contest.end_at).getTime();
    const tNow = now ?? grandStart;

    const activeStages = stages.filter((s) => isActive(s, tNow));
    const canSubmit = activeStages.some((s) => s.allow_submission);

    return (
        <div className="space-y-3">
            {showCurrentStatus && (
                <div className="rounded-[8px] border border-(--border-color) bg-(--post-card) p-4">
                    <p className="text-xs uppercase tracking-widest text-foreground/70 mb-2">
                        {t("currentlyIn")}
                    </p>
                    {activeStages.length === 0 ? (
                        <p className="text-sm text-foreground/70">
                            {t("noActiveStage")}
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {activeStages.map((s) => (
                                <span
                                    key={s.id}
                                    className="px-2 py-1 rounded-[4px] text-xs bg-accent/20 text-accent border border-accent/40"
                                >
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        {canSubmit && submissionCtaHref ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href={submissionCtaHref}
                                    className="inline-flex items-center gap-1.5 rounded-[4px] border border-amber-500/40 bg-amber-500/15 px-2 py-1 font-semibold text-amber-500 transition-colors hover:bg-amber-500/20"
                                >
                                    <Upload size={12} /> {t("submissionOpen")}
                                </Link>
                                <span className="text-[11px] text-foreground/50">{t("submissionOpenHint")}</span>
                            </div>
                        ) : (
                            <span
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] ${
                                    canSubmit
                                        ? "bg-amber-500/15 text-amber-500"
                                        : "bg-foreground/5 text-foreground/50"
                                }`}
                            >
                                <Upload size={12} /> {canSubmit ? t("submissionOpen") : t("submissionClosed")}
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div className="rounded-[8px] border border-(--border-color) bg-(--post-card) p-4">
                <div className="space-y-3">
                    {stages.map((s) => {
                        const sStart = new Date(s.start_at).getTime();
                        const sEnd = new Date(s.end_at).getTime();
                        const left = pct(grandStart, grandEnd, sStart);
                        const right = pct(grandStart, grandEnd, sEnd);
                        const width = Math.max(2, right - left);
                        const active = isActive(s, tNow);
                        const past = sEnd < tNow;
                        const barColor = active
                            ? "bg-amber-500"
                            : past
                              ? "bg-foreground/30"
                              : "bg-blue-500/60";
                        return (
                            <div key={s.id} className="space-y-1">
                                <div className="flex items-start justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className={`font-semibold truncate ${
                                                active ? "text-amber-500" : ""
                                            }`}
                                        >
                                            {s.name}
                                        </span>
                                        {s.allow_submission && (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500">
                                                <Upload size={10} /> {t("stageBadgeSubmission")}
                                            </span>
                                        )}
                                        {past && (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] text-foreground/40">
                                                <CheckCircle2 size={10} />
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-foreground/70 whitespace-nowrap text-[10px]">
                                        {formatDateTime(s.start_at)} – {formatDateTime(s.end_at)}
                                    </div>
                                </div>
                                <div className="relative h-2 bg-foreground/5 rounded-full overflow-hidden">
                                    <div
                                        className={`absolute top-0 bottom-0 ${barColor} rounded-full`}
                                        style={{ left: `${left}%`, width: `${width}%` }}
                                    />
                                </div>
                                {s.description && (
                                    <p className="text-[11px] text-foreground/70 leading-relaxed">
                                        {s.description}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
                {now !== null && (
                    <div className="mt-3 pt-3 border-t border-(--border-color) flex items-center gap-2 text-[11px] text-foreground/70">
                        <Calendar size={12} />
                        <span>
                            {t("grandWindow", {
                                start: formatDateTime(contest.start_at),
                                end: formatDateTime(contest.end_at),
                            })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
