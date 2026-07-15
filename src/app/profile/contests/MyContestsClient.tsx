"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, Clock, Users, Upload, FileText, CheckCircle2, RefreshCw, Trash2, Search, X, LinkIcon } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import Select from "@/components/ui/Select";
import type { DbContest, DbContestStage, DbContestRegistration, DbRegistrationMember, DbSubmission } from "@/types/database";

// ─── types ──────────────────────────────────────────────────────────────────

interface ContestWithStages extends DbContest {
    contest_stage: DbContestStage[];
}

interface MemberWithUser extends DbRegistrationMember {
    users?: {
        username: string;
        full_name: string;
    };
}

interface RegistrationForProfile extends DbContestRegistration {
    contest: ContestWithStages;
    submission: DbSubmission[];
    registration_member: MemberWithUser[];
}

// ─── helpers ────────────────────────────────────────────────────────────────

function isSubmissionOpen(contest: ContestWithStages): boolean {
    if (!contest || contest.status !== "active" || !contest.contest_stage) return false;
    const now = Date.now();
    return contest.contest_stage.some((stage) => {
        if (!stage.allow_submission) return false;
        const start = new Date(stage.start_at).getTime();
        const end = new Date(stage.end_at).getTime();
        return start <= now && now <= end;
    });
}

function getActiveSubmissionStage(contest: ContestWithStages): DbContestStage | null {
    if (!contest?.contest_stage) return null;
    const now = Date.now();
    return (
        contest.contest_stage.find((s) => {
            if (!s.allow_submission) return false;
            return new Date(s.start_at).getTime() <= now && now <= new Date(s.end_at).getTime();
        }) ?? null
    );
}

function getActiveStage(contest: ContestWithStages): DbContestStage | null {
    if (!contest?.contest_stage) return null;
    const now = Date.now();
    return (
        contest.contest_stage.find((s) => {
            return new Date(s.start_at).getTime() <= now && now <= new Date(s.end_at).getTime();
        }) ?? null
    );
}

function formatCountdown(targetIso: string): string {
    const ms = new Date(targetIso).getTime() - Date.now();
    if (ms <= 0) return "0 giây";
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây`;
    if (hours > 0) return `${hours} giờ ${minutes} phút ${seconds} giây`;
    if (minutes > 0) return `${minutes} phút ${seconds} giây`;
    return `${seconds} giây`;
}

function CountdownText({ targetIso }: { targetIso: string }) {
    const [value, setValue] = useState(() => formatCountdown(targetIso));
    useEffect(() => {
        const tick = () => setValue(formatCountdown(targetIso));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetIso]);
    return <>{value}</>;
}

function LinkifiedText({ text }: { text: string }) {
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return (
        <>
            {parts.map((part, index) => {
                if (/^https?:\/\//.test(part)) {
                    return (
                        <a
                            key={`${part}-${index}`}
                            href={part}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-accent hover:underline"
                        >
                            <LinkIcon className="w-3 h-3" />
                            {part}
                        </a>
                    );
                }
                return <span key={`${part}-${index}`}>{part}</span>;
            })}
        </>
    );
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── UploadForm ─────────────────────────────────────────────────────────────

function UploadForm({
    registrationId,
    onSuccess,
    replacing,
}: {
    registrationId: number;
    onSuccess: () => void;
    replacing: boolean;
}) {
    const { showToast } = useToast();
    const t = useTranslations("myContests");
    const [file, setFile] = useState<File | null>(null);
    const [note, setNote] = useState("");
    const [uploading, setUploading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) { showToast("warning", t("selectFile")); return; }
        if (file.size > 5 * 1024 * 1024) { showToast("error", t("fileTooLarge")); return; }

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("registration_id", registrationId.toString());
            fd.append("file", file);
            if (note) fd.append("note", note);

            const res = await fetch("/api/submissions", { method: "POST", body: fd });
            const json = await res.json();
            if (json.success) {
                showToast("success", replacing ? t("replaceSuccess") : t("submitSuccess"));
                onSuccess();
            } else {
                showToast("error", json.message || t("submitError"));
            }
        } catch {
            showToast("error", t("submitNetworkError"));
        } finally {
            setUploading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-background border border-(--border-color) space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
                {replacing ? <RefreshCw className="w-4 h-4 text-accent" /> : <Upload className="w-4 h-4 text-accent" />}
                {replacing ? t("replaceTitle") : t("submitTitle")}
            </h4>
            <div>
                <label className="block text-xs font-medium text-foreground/70 mb-1.5">
                    {t("fileLabel")}
                </label>
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                    className="block w-full text-sm text-foreground/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 transition-colors"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-foreground/70 mb-1.5">{t("noteLabel")}</label>
                <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={uploading}
                    className="w-full px-3 py-2 rounded-md border border-(--border-color) bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder={t("notePlaceholder")}
                />
            </div>
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={uploading || !file}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : replacing ? (
                        <RefreshCw className="w-4 h-4" />
                    ) : (
                        <Upload className="w-4 h-4" />
                    )}
                    {replacing ? t("confirmReplace") : t("confirmSubmit")}
                </button>
            </div>
        </form>
    );
}

// ─── SubmissionSection ───────────────────────────────────────────────────────

function SubmissionSection({ registration, onRefresh }: { registration: RegistrationForProfile; onRefresh: () => void }) {
    const { showToast } = useToast();
    const t = useTranslations("myContests");
    const [showReplaceForm, setShowReplaceForm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const open = isSubmissionOpen(registration.contest);
    const activeStage = getActiveSubmissionStage(registration.contest);
    const submissions: DbSubmission[] = registration.submission ?? [];
    const existing = submissions[0] ?? null; // API returns most recent first
    const canEditSubmission = open && !!activeStage;

    async function handleDelete() {
        if (!existing) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/submissions/${existing.id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                showToast("success", t("deleteSuccess"));
                onRefresh();
            } else {
                showToast("error", json.message || t("deleteError"));
            }
        } catch {
            showToast("error", t("deleteError"));
        } finally {
            setDeleting(false);
        }
    }

    if (!open) return null;

    // No existing submission → show upload form
    if (!existing) {
        return (
            <div className="mt-4 pt-4 border-t border-(--border-color)/80">
                <UploadForm
                    registrationId={registration.id}
                    replacing={false}
                    onSuccess={onRefresh}
                />
            </div>
        );
    }

    // Has existing submission
    return (
        <div className="mt-4 pt-4 border-t border-(--border-color)/80 space-y-3">
            {/* existing file card */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-600">{t("submitted")}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <FileText className="w-3.5 h-3.5 text-foreground/50 shrink-0" />
                        <span className="text-xs text-foreground/70 truncate">{existing.file_name}</span>
                        <span className="text-xs text-foreground/40 shrink-0">
                            ({formatBytes(existing.file_size_bytes)})
                        </span>
                    </div>
                    <p className="text-xs text-foreground/50 mt-0.5">
                        {new Date(existing.submitted_at).toLocaleString("vi-VN")}
                        {existing.note && <span className="ml-1 italic">— {existing.note}</span>}
                    </p>
                </div>
                {canEditSubmission && (
                    <div className="flex gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowReplaceForm((v) => !v)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border border-(--border-color) hover:border-accent hover:text-accent transition-colors cursor-pointer"
                        >
                            <RefreshCw className="w-3 h-3" />
                            {t("replaceBtn")}
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded border border-(--border-color) text-red-400 hover:border-red-400 hover:bg-red-400/10 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Trash2 className="w-3 h-3" />
                            {deleting ? "..." : t("deleteBtn")}
                        </button>
                    </div>
                )}
            </div>

            {canEditSubmission && showReplaceForm && (
                <UploadForm
                    registrationId={registration.id}
                    replacing={true}
                    onSuccess={() => { setShowReplaceForm(false); onRefresh(); }}
                />
            )}
        </div>
    );
}

type StatusFilter = "all" | "open" | "submitted" | "closed";
type ContestSort = "newest" | "oldest" | "title" | "endingSoon";

// ─── MyContestsClient ────────────────────────────────────────────────────────

export function MyContestsClient() {
    const tMC = useTranslations("myContests");
    const [registrations, setRegistrations] = useState<RegistrationForProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [sort, setSort] = useState<ContestSort>("newest");

    async function fetchRegs() {
        try {
            const res = await fetch("/api/users/me/registrations");
            if (res.ok) {
                const json = await res.json();
                if (json.success) setRegistrations(json.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchRegs(); }, []);

    const displayed = useMemo(() => {
        const q = search.trim().toLowerCase();
        const result = registrations.filter((reg) => {
            const contest = reg.contest;
            const hasSubmission = (reg.submission ?? []).length > 0;
            const open = isSubmissionOpen(contest);
            if (statusFilter === "open" && !open) return false;
            if (statusFilter === "submitted" && !hasSubmission) return false;
            if (statusFilter === "closed" && open) return false;
            if (!q) return true;
            return [
                contest?.title,
                contest?.description,
                reg.team_name,
                reg.team_code,
                reg.level,
            ].some((value) => value?.toLowerCase().includes(q));
        });
        result.sort((a, b) => {
            if (sort === "oldest") return new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime();
            if (sort === "title") return (a.contest?.title ?? "").localeCompare(b.contest?.title ?? "");
            if (sort === "endingSoon") {
                const aStage = getActiveStage(a.contest);
                const bStage = getActiveStage(b.contest);
                const aEnd = aStage ? new Date(aStage.end_at).getTime() : Number.MAX_SAFE_INTEGER;
                const bEnd = bStage ? new Date(bStage.end_at).getTime() : Number.MAX_SAFE_INTEGER;
                return aEnd - bEnd;
            }
            return new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime();
        });
        return result;
    }, [registrations, search, sort, statusFilter]);

    const hasFilter = !!search || statusFilter !== "all" || sort !== "newest";

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> {tMC("backToProfile")}
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{tMC("pageTitle")}</h1>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
            ) : registrations.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-(--border-color) rounded-xl">
                    <p className="text-foreground/60">{tMC("emptyState")}</p>
                </div>
            ) : (
                <>
                    <div className="mb-5 flex flex-wrap gap-2">
                        <div className="relative min-w-[220px] flex-1">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={tMC("searchPlaceholder")}
                                className="w-full rounded-md border border-(--border-color) bg-(--post-card) py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-accent/50"
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                            options={[
                                { value: "all", label: tMC("filterAll") },
                                { value: "open", label: tMC("filterOpen") },
                                { value: "submitted", label: tMC("filterSubmitted") },
                                { value: "closed", label: tMC("filterClosed") },
                            ]}
                            className="text-sm"
                        />
                        <Select
                            value={sort}
                            onValueChange={(v) => setSort(v as ContestSort)}
                            options={[
                                { value: "newest", label: tMC("sortNewest") },
                                { value: "oldest", label: tMC("sortOldest") },
                                { value: "title", label: tMC("sortTitle") },
                                { value: "endingSoon", label: tMC("sortEndingSoon") },
                            ]}
                            className="text-sm"
                        />
                        {hasFilter && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setStatusFilter("all");
                                    setSort("newest");
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-md border border-(--border-color) hover:border-accent hover:text-accent transition-colors cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                                {tMC("resetFilters")}
                            </button>
                        )}
                    </div>
                    {displayed.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-(--border-color) rounded-xl">
                            <p className="text-foreground/60">{tMC("noResults")}</p>
                        </div>
                    ) : (
                    <div className="space-y-4">
                    {displayed.map((reg) => {
                        const activeStage = getActiveStage(reg.contest);
                        const submissionStage = getActiveSubmissionStage(reg.contest);
                        return (
                        <div key={reg.id} className="p-4 sm:p-5 rounded-xl border border-(--border-color) bg-(--post-card) shadow-sm flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <Link href={`/contests/${reg.contest?.slug}`} className="text-lg font-semibold hover:text-accent transition-colors">
                                        {reg.contest?.title || tMC("untitledContest")}
                                    </Link>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-foreground/60 flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {tMC("registeredAt")} {new Date(reg.registered_at).toLocaleDateString("vi-VN")}
                                        </span>
                                        {reg.team_name && (
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                {tMC("team")} {reg.team_name}
                                            </span>
                                        )}
                                        {reg.team_code && <span>{reg.team_code}</span>}
                                        {reg.level && <span>{reg.level}</span>}
                                    </div>
                                </div>
                            </div>

                            {activeStage && (
                                <div className="grid gap-3 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm sm:grid-cols-[1fr_auto]">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-foreground/50">{tMC("currentStage")}</p>
                                        <p className="font-semibold text-accent">{activeStage.name}</p>
                                        {activeStage.description && (
                                            <p className="mt-1 text-xs text-foreground/66">{activeStage.description}</p>
                                        )}
                                    </div>
                                    <div className="sm:text-right">
                                        <p className="text-xs uppercase tracking-widest text-foreground/50">{tMC("stageEndsIn")}</p>
                                        <p className="font-mono text-sm text-foreground">
                                            <CountdownText targetIso={activeStage.end_at} />
                                        </p>
                                    </div>
                                    {submissionStage?.prompt_text && (
                                        <div className="sm:col-span-2 border-t border-accent/15 pt-3">
                                            <p className="text-xs uppercase tracking-widest text-foreground/50 mb-1">{tMC("stagePrompt")}</p>
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                                                <LinkifiedText text={submissionStage.prompt_text} />
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {reg.registration_member?.length > 0 && (
                                <div className="pt-3 border-t border-(--border-color)/50">
                                    <p className="text-xs font-medium text-foreground/50 mb-2 uppercase tracking-wide">{tMC("members")}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {reg.registration_member.map((m) => (
                                            <span key={m.user_id} className="text-xs px-2 py-1 rounded bg-foreground/5 border border-(--border-color)">
                                                {m.users?.full_name || m.users?.username || tMC("anonymous")}
                                                {m.role === "leader" && <span className="ml-1 text-accent">Leader</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <SubmissionSection registration={reg} onRefresh={fetchRegs} />
                        </div>
                    );})}
                    </div>
                    )}
                </>
            )}
        </div>
    );
}
