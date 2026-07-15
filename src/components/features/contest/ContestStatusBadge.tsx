"use client";

import { useTranslations } from "next-intl";
import type { ContestStatus, ContestParticipationType } from "@/types/database";

const STATUS_STYLE: Record<ContestStatus, string> = {
    draft: "bg-foreground/10 text-foreground/70",
    active: "bg-green-500/20 text-green-500",
    closed: "bg-foreground/10 text-foreground/60",
    cancelled: "bg-red-500/20 text-red-500",
};

export function ContestStatusBadge({ status }: { status: ContestStatus }) {
    const t = useTranslations("contestStatus");
    return (
        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-[4px] ${STATUS_STYLE[status]}`}>
            {t(status)}
        </span>
    );
}

export function ContestTypeBadge({ type }: { type: ContestParticipationType }) {
    const t = useTranslations("contestType");
    return (
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-[4px] bg-accent/20 text-accent">
            {t(type)}
        </span>
    );
}
