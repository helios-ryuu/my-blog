import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getContestBySlug, userHasRegistration } from "@/lib/contests-db";
import { shouldBypassImageOptimization } from "@/lib/images";
import { getCurrentUser } from "@/lib/supabase/server";
import { mdxComponents } from "../../../../mdx-components";
import {
    ContestStatusBadge,
    ContestTypeBadge,
} from "@/components/features/contest/ContestStatusBadge";
import ContestCountdown from "@/components/features/contest/ContestCountdown";
import ContestStageTimeline from "@/components/features/contest/ContestStageTimeline";
import PageHeader from "@/components/layout/PageHeader";
import type { ContestWithStages } from "@/types/database";

interface Props {
    params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

const getCachedContest = unstable_cache(
    async (slug: string) => {
        const supabase = createSupabaseAdminClient();
        return getContestBySlug(supabase, slug);
    },
    ["public-contest"],
    { revalidate: 60, tags: ["contests"] },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const contest = await getCachedContest(slug);
    if (!contest) {
        return { title: "Kỳ thi không tồn tại — Toán Mô Hình Hà Nội" };
    }
    return {
        title: `${contest.title} — Toán Mô Hình Hà Nội`,
        description: contest.description,
    };
}

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

function formatParticipation(contest: ContestWithStages): string {
    if (contest.participation_type === "individual") return "Cá nhân tham gia riêng lẻ";
    if (contest.min_team_size === contest.max_team_size) {
        return `Mỗi đội thi gồm ${contest.max_team_size} thành viên`;
    }
    return `Mỗi đội thi gồm ${contest.min_team_size}-${contest.max_team_size} thành viên`;
}

function hasActiveSubmissionStage(contest: ContestWithStages): boolean {
    const now = Date.now();
    return contest.stages.some((stage) => {
        if (!stage.allow_submission) return false;
        const start = new Date(stage.start_at).getTime();
        const end = new Date(stage.end_at).getTime();
        return start <= now && now <= end;
    });
}

export default async function ContestDetailPage({ params }: Props) {
    const { slug } = await params;
    const contest: ContestWithStages | null = await getCachedContest(slug);

    if (!contest) {
        notFound();
    }

    const t = await getTranslations("contests");
    const tType = await getTranslations("contestType");
    const current = await getCurrentUser();
    const supabase = createSupabaseAdminClient();
    const isRegistered = current
        ? await userHasRegistration(supabase, contest.id, current.profile.id)
        : false;
    const canSubmit = isRegistered && hasActiveSubmissionStage(contest);

    let rulesContent: React.ReactNode = null;
    if (contest.rules) {
        const { content } = await compileMDX({
            source: contest.rules,
            components: mdxComponents,
            options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
        });
        rulesContent = content;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-4">
                <Link
                    href="/contests"
                    className="text-xs text-foreground/60 hover:text-accent transition-colors"
                >
                    {t("back")}
                </Link>
            </div>

            {contest.cover_image_url && (
                <div className="relative w-full h-56 md:h-72 mb-6 rounded-xl overflow-hidden border border-(--border-color)">
                    <Image
                        src={contest.cover_image_url}
                        alt={contest.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 800px"
                        className="object-cover"
                        unoptimized={shouldBypassImageOptimization(contest.cover_image_url)}
                        priority
                    />
                </div>
            )}

            <div className="mb-3 flex flex-wrap items-center gap-2">
                <ContestStatusBadge status={contest.status} />
                <ContestTypeBadge type={contest.participation_type} />
                <span className="text-xs text-foreground">
                    {formatParticipation(contest)}
                </span>
            </div>

            <PageHeader
                title={contest.title}
                description={contest.description}
                descriptionClassName="text-foreground"
            />

            <div className="mb-6">
                <ContestCountdown contest={contest} />
            </div>

            {rulesContent && (
                <section className="mb-6">
                    <h2 className="text-sm font-bold tracking-widest text-foreground/84 uppercase mb-2">
                        {t("rules")}
                    </h2>
                    <div className="text-sm text-foreground leading-relaxed">
                        {rulesContent}
                    </div>
                </section>
            )}

            <section className="mb-6">
                <h2 className="text-sm font-bold tracking-widest text-foreground/84 uppercase mb-2">
                    {t("timeline")}
                </h2>
                <div className="rounded-[8px] border border-(--border-color) bg-(--post-card) px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <div className="text-xs uppercase tracking-widest text-foreground/70">{t("grandStart")}</div>
                        <div className="text-sm">{formatDateTime(contest.start_at)}</div>
                    </div>
                    <div className="hidden sm:block text-foreground/30">→</div>
                    <div className="sm:text-right">
                        <div className="text-xs uppercase tracking-widest text-foreground/70">{t("grandEnd")}</div>
                        <div className="text-sm">{formatDateTime(contest.end_at)}</div>
                    </div>
                </div>
            </section>

            <section className="mb-6">
                <h2 className="text-sm font-bold tracking-widest text-foreground/84 uppercase mb-2">
                    {t("stages")}
                </h2>
                <ContestStageTimeline
                    contest={contest}
                    showCurrentStatus={isRegistered}
                    submissionCtaHref={canSubmit ? "/profile/contests" : undefined}
                />
            </section>

            <section className="mb-6">
                <h2 className="text-sm font-bold tracking-widest text-foreground/84 uppercase mb-2">
                    {t("participation")}
                </h2>
                <p className="text-sm text-foreground">
                    {tType(contest.participation_type)}
                    {" — "}
                    {formatParticipation(contest)}.
                </p>
            </section>

            <section className="mt-8 border-t border-(--border-color) pt-6">
                <p className="text-sm text-foreground">
                    Tài khoản, đội thi và thành viên sẽ được ban tổ chức cấp khi tham gia cuộc thi.
                </p>
            </section>
        </div>
    );
}
