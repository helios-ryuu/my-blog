import Link from "next/link";
import Image from "next/image";
import { Calendar } from "lucide-react";
import { shouldBypassImageOptimization } from "@/lib/images";
import type { DbContest, DbContestStage, ContestWithStages } from "@/types/database";
import { ContestStatusBadge, ContestTypeBadge } from "./ContestStatusBadge";

function formatDate(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return iso;
    }
}

function stageChipClasses(stage: DbContestStage): string {
    const base = "px-1.5 py-0.5 rounded-[4px] text-[10px] tracking-wide whitespace-nowrap border ";
    if (stage.allow_submission) return base + "bg-amber-500/10 text-amber-500 border-amber-500/30";
    return base + "bg-foreground/5 text-foreground/70 border-(--border-color)";
}

type CardContest = DbContest | ContestWithStages;

function formatParticipation(contest: CardContest): string {
    if (contest.participation_type === "individual") return "Cá nhân tham gia riêng lẻ";
    if (contest.min_team_size === contest.max_team_size) return `Mỗi đội ${contest.max_team_size} thành viên`;
    return `Mỗi đội ${contest.min_team_size}-${contest.max_team_size} thành viên`;
}

export default function ContestCard({ contest }: { contest: CardContest }) {
    const stages: DbContestStage[] = "stages" in contest && Array.isArray(contest.stages) ? contest.stages : [];
    const visibleStages = stages.slice(0, 3);
    const extra = stages.length - visibleStages.length;

    return (
        <Link
            href={`/contests/${contest.slug}`}
            className="group flex flex-col rounded-[8px] border border-(--border-color) bg-(--post-card) hover:bg-(--post-card-hover) hover:border-(--border-color-hover) transition-colors overflow-hidden"
        >
            <div className="relative w-full h-40 bg-linear-to-br from-accent/20 via-background to-background-hover">
                {contest.cover_image_url && (
                    <Image
                        src={contest.cover_image_url}
                        alt={contest.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover"
                        unoptimized={shouldBypassImageOptimization(contest.cover_image_url)}
                    />
                )}
                <div className="absolute top-2 left-2 flex gap-1.5">
                    <ContestStatusBadge status={contest.status} />
                </div>
            </div>

            <div className="flex flex-col flex-1 p-4">
                <div className="flex items-start gap-2 mb-2">
                    <ContestTypeBadge type={contest.participation_type} />
                    <span className="text-[10px] text-foreground/70 tracking-wider">
                        {formatParticipation(contest)}
                    </span>
                </div>

                <h2 className="font-semibold text-lg tracking-wide line-clamp-2 leading-tight group-hover:text-accent transition-colors">
                    {contest.title}
                </h2>
                <p className="text-xs text-foreground/70 mt-1 line-clamp-3 flex-1">
                    {contest.description}
                </p>

                {visibleStages.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {visibleStages.map((s) => (
                            <span key={s.id} className={stageChipClasses(s)}>
                                {s.name}
                            </span>
                        ))}
                        {extra > 0 && (
                            <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] text-foreground/70 border border-(--border-color)">
                                +{extra}
                            </span>
                        )}
                    </div>
                )}

                <div className="mt-3 pt-3 border-t border-(--border-color) flex items-center gap-2 text-xs text-foreground/70">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>
                        {formatDate(contest.start_at)} – {formatDate(contest.end_at)}
                    </span>
                </div>
            </div>
        </Link>
    );
}
