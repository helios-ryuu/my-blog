"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Download, FileText, Pencil, Plus, Search, Trash2, X as XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/features/admin/common/Button";
import { useToast } from "@/components/ui/Toast";
import type {
    DbContest,
    DbContestRegistration,
    DbRegistrationMember,
    DbSubmission,
} from "@/types/database";
import type { User } from "@/types/user";

interface MemberWithUser extends DbRegistrationMember {
    users?: {
        username: string;
        full_name: string;
        email: string | null;
        phone: string | null;
        school: string | null;
    };
}

type RegistrationWithMembers = DbContestRegistration & { members: MemberWithUser[] };

type TeamDraft = {
    id?: number;
    team_code: string;
    team_name: string;
    level: string;
    leader_id: string;
    member_ids: string;
};

const EMPTY_TEAM_DRAFT: TeamDraft = {
    team_code: "",
    team_name: "",
    level: "",
    leader_id: "",
    member_ids: "",
};

interface Props {
    contest: DbContest;
    onBack: () => void;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SubmissionRow({ sub }: { sub: DbSubmission }) {
    const { showToast } = useToast();
    const t = useTranslations("registrations");
    const [loading, setLoading] = useState(false);

    async function download() {
        setLoading(true);
        try {
            const metaRes = await fetch(`/api/admin/submissions/${sub.id}/signed-url`);
            const metaJson = await metaRes.json();
            if (!metaJson.success) throw new Error(metaJson.message || t("linkError"));

            const fileRes = await fetch(metaJson.data.url);
            if (!fileRes.ok) throw new Error(t("downloadError"));
            const blob = await fileRes.blob();

            const anchor = document.createElement("a");
            anchor.href = URL.createObjectURL(blob);
            anchor.download = sub.file_name;
            anchor.click();
            URL.revokeObjectURL(anchor.href);
        } catch (err) {
            showToast("error", err instanceof Error ? err.message : t("downloadError"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-2 p-2 rounded bg-foreground/5 border border-(--border-color)">
            <FileText className="w-4 h-4 shrink-0 text-foreground/50" />
            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{sub.file_name}</div>
                <div className="text-[10px] text-foreground/50 mt-0.5">
                    {formatBytes(sub.file_size_bytes)} •{" "}
                    {new Date(sub.submitted_at).toLocaleString("vi-VN")}
                    {sub.is_final && (
                        <span className="ml-1.5 px-1 py-0.5 bg-accent/20 text-accent rounded text-[9px] uppercase tracking-wider">
                            {t("isFinal")}
                        </span>
                    )}
                    {sub.note && <span className="ml-1 text-foreground/40 italic">&quot;{sub.note}&quot;</span>}
                </div>
            </div>
            <button
                type="button"
                onClick={download}
                disabled={loading}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-(--border-color) hover:border-accent hover:text-accent transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
                <Download className="w-3 h-3" />
                {loading ? "..." : t("download")}
            </button>
        </div>
    );
}

function RegistrationCard({
    reg,
    submissions,
    actingId,
    onEdit,
    onDelete,
    isEditing,
}: {
    reg: RegistrationWithMembers;
    submissions: DbSubmission[];
    actingId: number | null;
    onEdit: (reg: RegistrationWithMembers) => void;
    onDelete: (id: number) => Promise<void>;
    isEditing: boolean;
}) {
    const t = useTranslations("registrations");
    const [expanded, setExpanded] = useState(false);
    const regSubs = submissions.filter((s) => s.registration_id === reg.id);

    return (
        <div className={`rounded-lg border bg-(--post-card) overflow-hidden transition-colors ${isEditing ? "border-accent shadow-[0_0_0_2px_rgba(31,81,255,0.14)]" : "border-(--border-color)"}`}>
            {/* Row header */}
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                >
                    <div className="flex items-center gap-2 flex-wrap">
                        {expanded ? (
                            <ChevronUp className="w-4 h-4 shrink-0 text-foreground/40" />
                        ) : (
                            <ChevronDown className="w-4 h-4 shrink-0 text-foreground/40" />
                        )}
                        <span className="text-sm font-medium">
                            {reg.team_name || `${t("registrationFallback")} #${reg.id}`}
                        </span>
                        {reg.team_code && (
                            <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-[4px] bg-foreground/10 text-foreground/60">
                                {reg.team_code}
                            </span>
                        )}
                        {reg.level && (
                            <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-[4px] bg-purple-500/15 text-purple-400">
                                {reg.level}
                            </span>
                        )}
                        {regSubs.length > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-[4px] bg-blue-500/20 text-blue-400">
                                {t("submissionCount", { count: regSubs.length })}
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-foreground/50 mt-0.5 ml-6">
                        {t("memberCount", { count: reg.members.length })} •{" "}
                        {new Date(reg.registered_at).toLocaleString()}
                    </div>
                </button>

                <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="save" icon={<Pencil className="w-4 h-4" />} onClick={() => onEdit(reg)}>
                        Sửa
                    </Button>
                    <Button
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => onDelete(reg.id)}
                        isLoading={actingId === reg.id}
                        loadingText="..."
                    >
                        Xoá
                    </Button>
                </div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div className="border-t border-(--border-color) px-4 py-3 grid md:grid-cols-2 gap-4">
                    {/* Members */}
                    <div>
                        <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-2">
                            {t("membersHeader", { count: reg.members.length })}
                        </div>
                        <div className="space-y-2">
                            {reg.members.map((m) => (
                                <div key={m.user_id} className="p-2 bg-foreground/5 rounded border border-(--border-color)">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span
                                            className={`shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${
                                                m.role === "leader"
                                                    ? "bg-accent/20 text-accent"
                                                    : "bg-foreground/10 text-foreground/60"
                                            }`}
                                        >
                                            {m.role === "leader" ? t("leaderRole") : t("memberRole")}
                                        </span>
                                        <span className="text-xs font-medium">
                                            {m.users?.full_name || m.users?.username || m.user_id.slice(0, 8)}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-foreground/50 space-y-0.5 ml-0.5">
                                        <div>@{m.users?.username ?? "—"}</div>
                                        {m.users?.email && <div>{m.users.email}</div>}
                                        {m.users?.phone && <div>{m.users.phone}</div>}
                                        {m.users?.school && <div>{m.users.school}</div>}
                                        <div>
                                            {t("joinedAt")}: {new Date(m.joined_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submissions */}
                    <div>
                        <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-2">
                            {t("submissions")}
                        </div>
                        {regSubs.length === 0 ? (
                            <div className="text-xs text-foreground/40 italic">{t("noSubmissions")}</div>
                        ) : (
                            <div className="space-y-1.5">
                                {regSubs.map((s) => (
                                    <SubmissionRow key={s.id} sub={s} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RegistrationManagementPanel({ contest, onBack }: Props) {
    const { showToast } = useToast();
    const t = useTranslations("registrations");

    const sortOptions = [
        { value: "newest", label: t("sortNewest") },
        { value: "oldest", label: t("sortOldest") },
        { value: "code", label: t("sortCode") },
        { value: "name", label: t("sortName") },
    ];

    const [regs, setRegs] = useState<RegistrationWithMembers[]>([]);
    const [accounts, setAccounts] = useState<User[]>([]);
    const [submissions, setSubmissions] = useState<DbSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("newest");
    const [draft, setDraft] = useState<TeamDraft>(EMPTY_TEAM_DRAFT);
    const [glowForm, setGlowForm] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);
    const userOptions = accounts.filter((u) => u.role !== "admin");

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const [regsRes, subsRes] = await Promise.all([
                fetch(`/api/admin/contests/${contest.id}/registrations`),
                fetch(`/api/admin/contests/${contest.id}/submissions`),
            ]);
            for (const res of [regsRes, subsRes]) {
                const ct = res.headers.get("content-type") ?? "";
                if (!ct.includes("application/json")) {
                    throw new Error(
                        res.status === 401 || res.status === 403
                            ? t("sessionExpired")
                            : t("serverError", { status: res.status }),
                    );
                }
            }
            const [regsJson, subsJson] = await Promise.all([regsRes.json(), subsRes.json()]);
            if (!regsJson.success) throw new Error(regsJson.message || t("loading"));
            if (!subsJson.success) throw new Error(subsJson.message || t("loading"));
            setRegs(regsJson.data ?? []);
            setSubmissions(subsJson.data ?? []);
        } catch (err) {
            showToast("error", err instanceof Error ? err.message : t("loading"));
        } finally {
            setLoading(false);
        }
    }, [contest.id, showToast, t]);

    useEffect(() => { refresh(); }, [refresh]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/admin/accounts", { cache: "no-store" });
                const json = await res.json();
                if (!cancelled && json.success) setAccounts(json.data ?? []);
            } catch {
                // Registration management still works for existing teams.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    function editTeam(reg: RegistrationWithMembers) {
        const leader = reg.members.find((m) => m.role === "leader");
        const members = reg.members.filter((m) => m.role !== "leader").map((m) => m.user_id);
        setDraft({
            id: reg.id,
            team_code: reg.team_code ?? "",
            team_name: reg.team_name ?? "",
            level: reg.level ?? "",
            leader_id: leader?.user_id ?? "",
            member_ids: members.join(", "),
        });
        setGlowForm(true);
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.setTimeout(() => setGlowForm(false), 900);
    }

    async function saveTeam() {
        const memberIds = draft.member_ids
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
            .map((token) => accounts.find((u) => u.username === token || u.id === token)?.id ?? token);
        if (!draft.team_code.trim() || !draft.leader_id) {
            showToast("warning", "Mã đội và trưởng nhóm là bắt buộc.");
            return;
        }
        setActingId(draft.id ?? -1);
        try {
            const res = await fetch(
                draft.id ? `/api/admin/registrations/${draft.id}` : `/api/admin/contests/${contest.id}/registrations`,
                {
                    method: draft.id ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        team_code: draft.team_code,
                        team_name: draft.team_name || null,
                        level: draft.level || null,
                        leader_id: draft.leader_id,
                        member_ids: memberIds,
                    }),
                },
            );
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Lưu đội thất bại.");
            showToast("success", draft.id ? "Đã cập nhật đội." : "Đã tạo đội.");
            setDraft(EMPTY_TEAM_DRAFT);
            refresh();
        } catch (err) {
            showToast("error", err instanceof Error ? err.message : "Lưu đội thất bại.");
        } finally {
            setActingId(null);
        }
    }

    async function deleteTeam(id: number) {
        setActingId(id);
        try {
            const res = await fetch(`/api/admin/registrations/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Xoá đội thất bại.");
            showToast("success", "Đã xoá đội.");
            refresh();
        } catch (err) {
            showToast("error", err instanceof Error ? err.message : "Xoá đội thất bại.");
        } finally {
            setActingId(null);
        }
    }

    const displayed = useMemo(() => {
        let result = [...regs];

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter((r) => {
                if (r.team_name?.toLowerCase().includes(q)) return true;
                if (r.team_code?.toLowerCase().includes(q)) return true;
                if (r.level?.toLowerCase().includes(q)) return true;
                return r.members.some(
                    (m) =>
                        m.users?.username?.toLowerCase().includes(q) ||
                        m.users?.full_name?.toLowerCase().includes(q) ||
                        m.users?.email?.toLowerCase().includes(q) ||
                        m.users?.phone?.toLowerCase().includes(q),
                );
            });
        }

        result.sort((a, b) => {
            if (sort === "oldest")
                return new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime();
            if (sort === "code") return a.team_code.localeCompare(b.team_code);
            if (sort === "name") return (a.team_name ?? "").localeCompare(b.team_name ?? "");
            return new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime();
        });

        return result;
    }, [regs, search, sort]);

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-accent transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t("backLabel")}
                </button>
                <span className="text-foreground/30">/</span>
                <h2 className="text-lg font-semibold tracking-wide">{contest.title}</h2>
                <span className="text-xs text-foreground/40">— {t("panelTitle")}</span>
            </div>

            <div
                ref={formRef}
                className={`mb-5 rounded-lg border bg-(--post-card) p-4 transition-shadow ${
                    glowForm ? "border-accent shadow-[0_0_0_3px_rgba(31,81,255,0.16),0_0_34px_rgba(31,81,255,0.22)]" : "border-(--border-color)"
                }`}
            >
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-widest">
                        {draft.id ? t("editTeamTitle", { code: draft.team_code }) : t("createTeamTitle")}
                    </h3>
                    {draft.id && (
                        <button
                            type="button"
                            onClick={() => setDraft(EMPTY_TEAM_DRAFT)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-foreground/10"
                            aria-label="Huỷ sửa đội"
                        >
                            <XIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                    <input
                        value={draft.team_code}
                        onChange={(e) => setDraft((d) => ({ ...d, team_code: e.target.value }))}
                        placeholder="TEAM_CODE"
                        className="rounded-md border border-(--border-color) bg-background px-3 py-2 text-sm outline-none"
                    />
                    <input
                        value={draft.team_name}
                        onChange={(e) => setDraft((d) => ({ ...d, team_name: e.target.value }))}
                        placeholder="TEAM_NAME"
                        className="rounded-md border border-(--border-color) bg-background px-3 py-2 text-sm outline-none"
                    />
                    <input
                        value={draft.level}
                        onChange={(e) => setDraft((d) => ({ ...d, level: e.target.value }))}
                        placeholder="LEVEL"
                        className="rounded-md border border-(--border-color) bg-background px-3 py-2 text-sm outline-none"
                    />
                    <select
                        value={draft.leader_id}
                        onChange={(e) => setDraft((d) => ({ ...d, leader_id: e.target.value }))}
                        className="rounded-md border border-(--border-color) bg-background px-3 py-2 text-sm outline-none"
                    >
                        <option value="">Chọn trưởng nhóm</option>
                        {userOptions.map((u) => (
                            <option key={u.id} value={u.id}>{u.full_name} (@{u.username})</option>
                        ))}
                    </select>
                    <input
                        value={draft.member_ids}
                        onChange={(e) => setDraft((d) => ({ ...d, member_ids: e.target.value }))}
                        placeholder="Username hoặc ID thành viên, phân cách dấu phẩy"
                        className="rounded-md border border-(--border-color) bg-background px-3 py-2 text-sm outline-none md:col-span-2"
                    />
                    <Button
                        variant="primary"
                        icon={draft.id ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        onClick={saveTeam}
                        isLoading={actingId === (draft.id ?? -1)}
                        loadingText="..."
                        className="md:col-span-3"
                    >
                        {draft.id ? t("saveTeam") : t("createTeam")}
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 mb-3">
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/40 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("search")}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-(--border-color) bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                </div>
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-md border border-(--border-color) bg-background text-foreground focus:outline-none cursor-pointer"
                >
                    {sortOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>
            {/* Content */}
            {loading ? (
                <div className="rounded-lg border border-(--border-color) bg-(--post-card) p-8 text-center text-sm text-foreground/60">
                    {t("loading")}
                </div>
            ) : displayed.length === 0 ? (
                <div className="rounded-lg border border-(--border-color) bg-(--post-card) p-6 text-sm text-foreground/60">
                    {search ? t("noResults", { q: search }) : t("empty")}
                </div>
            ) : (
                <div className="space-y-3">
                    {displayed.map((r) => (
                        <RegistrationCard
                            key={r.id}
                            reg={r}
                            submissions={submissions}
                            actingId={actingId}
                            onEdit={editTeam}
                            onDelete={deleteTeam}
                            isEditing={draft.id === r.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
