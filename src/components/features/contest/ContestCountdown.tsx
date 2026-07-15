"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { DbContest, DbContestStage, ContestWithStages } from "@/types/database";

interface Milestone {
    label: string;
    target: Date;
}

function pickMilestone(
    contest: DbContest,
    stages: DbContestStage[],
    now: Date,
    t: (key: string, vars?: Record<string, string | number>) => string,
): Milestone | null {
    const tNow = now.getTime();
    const candidates: Milestone[] = [];
    if (new Date(contest.start_at).getTime() > tNow) {
        candidates.push({ label: t("countdownStartsIn"), target: new Date(contest.start_at) });
    }
    for (const s of stages) {
        const sStart = new Date(s.start_at);
        const sEnd = new Date(s.end_at);
        if (sStart.getTime() > tNow) {
            candidates.push({ label: t("stageOpensIn", { name: s.name }), target: sStart });
        } else if (sEnd.getTime() > tNow) {
            candidates.push({ label: t("stageClosesIn", { name: s.name }), target: sEnd });
        }
    }
    if (new Date(contest.end_at).getTime() > tNow) {
        candidates.push({ label: t("countdownEndsIn"), target: new Date(contest.end_at) });
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.target.getTime() - b.target.getTime());
    return candidates[0];
}

function formatDelta(ms: number, locale: string): string {
    if (ms <= 0) return locale === "vi" ? "0 phút" : "0 minutes";
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (locale === "vi") {
        if (days > 0) return `${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây`;
        if (hours > 0) return `${hours} giờ ${minutes} phút ${seconds} giây`;
        return `${minutes} phút ${seconds} giây`;
    }
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
}

type CountdownContest = DbContest | ContestWithStages;

export default function ContestCountdown({ contest }: { contest: CountdownContest }) {
    const t = useTranslations("contests");
    const locale = useLocale();
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        const tick = () => setNow(new Date());
        const timeoutId = setTimeout(tick, 0);
        const interval = setInterval(tick, 1000);
        return () => {
            clearTimeout(timeoutId);
            clearInterval(interval);
        };
    }, []);

    if (!now) return null;

    if (contest.status === "closed" || contest.status === "cancelled") {
        return (
            <div className="rounded-[8px] border border-(--border-color) bg-(--post-card) p-4">
                <p className="text-sm text-foreground/70">
                    {contest.status === "closed" ? t("ended") : t("cancelled")}
                </p>
            </div>
        );
    }

    const stages: DbContestStage[] = "stages" in contest && Array.isArray(contest.stages) ? contest.stages : [];
    const milestone = pickMilestone(contest, stages, now, t);
    if (!milestone) {
        return (
            <div className="rounded-[8px] border border-(--border-color) bg-(--post-card) p-4">
                <p className="text-sm text-foreground/70">{t("allMilestonesPassed")}</p>
            </div>
        );
    }

    const delta = milestone.target.getTime() - now.getTime();

    return (
        <div className="rounded-[8px] border border-(--border-color) bg-(--post-card) p-4">
            <p className="text-xs uppercase tracking-widest text-foreground/70 mb-1">{milestone.label}</p>
            <p className="text-accent font-mono text-lg sm:text-xl">{formatDelta(delta, locale)}</p>
        </div>
    );
}
