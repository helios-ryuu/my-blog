"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Button } from "@/components/features/admin/common/Button";
import {
    ContestStatusBadge,
    ContestTypeBadge,
} from "@/components/features/contest/ContestStatusBadge";
import ContestForm from "./ContestForm";
import RegistrationManagementPanel from "./RegistrationManagementPanel";
import type { DbContest, ContestWithStages } from "@/types/database";

function formatDateRange(a: string, b: string): string {
    try {
        const f = (s: string) =>
            new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
        return `${f(a)} – ${f(b)}`;
    } catch {
        return `${a} – ${b}`;
    }
}

function ContestManagementWorkspace() {
    const { showToast } = useToast();
    const t = useTranslations("contestManagement");
    const [contests, setContests] = useState<ContestWithStages[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<ContestWithStages | null>(null);
    const [viewingPanel, setViewingPanel] = useState<DbContest | null>(null);
    const [deleting, setDeleting] = useState<ContestWithStages | null>(null);
    const [deletingBusy, setDeletingBusy] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/contests", { cache: "no-store" });
            const ct = res.headers.get("content-type") ?? "";
            if (!ct.includes("application/json")) {
                throw new Error(
                    res.status === 401 || res.status === 403
                        ? t("sessionExpired")
                        : t("serverError", { status: res.status }),
                );
            }
            const json = await res.json();
            if (json.success) setContests(json.data ?? []);
            else throw new Error(json.message || t("loading"));
        } catch (err) {
            showToast("error", err instanceof Error ? err.message : t("loading"));
        } finally {
            setLoading(false);
        }
    }, [showToast, t]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    async function confirmDelete() {
        if (!deleting) return;
        setDeletingBusy(true);
        try {
            const res = await fetch(`/api/admin/contests/${deleting.id}`, { method: "DELETE" });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || t("deleteError"));
            showToast("success", t("deleteSuccess"));
            setDeleting(null);
            refresh();
        } catch (err) {
            showToast("error", err instanceof Error ? err.message : t("deleteError"));
        } finally {
            setDeletingBusy(false);
        }
    }

    if (viewingPanel) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <RegistrationManagementPanel contest={viewingPanel} onBack={() => setViewingPanel(null)} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold tracking-widest text-accent">{t("title")}</h1>
                    <p className="text-sm text-foreground/70 mt-0.5">{t("subtitle")}</p>
                </div>
                <Button
                    variant="primary"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                        setEditing(null);
                        setShowForm(true);
                    }}
                >
                    {t("createNew")}
                </Button>
            </header>

            {loading ? (
                <div className="rounded-lg border border-(--border-color) bg-(--post-card) p-8 text-center text-sm text-foreground/60">
                    {t("loading")}
                </div>
            ) : contests.length === 0 ? (
                <div className="rounded-lg border border-(--border-color) bg-(--post-card) p-8 text-center">
                    <p className="text-sm text-foreground/60">{t("empty")}</p>
                </div>
            ) : (
                <div className="rounded-lg border border-(--border-color) bg-(--post-card) overflow-hidden">
                    <div className="hidden md:grid grid-cols-[2fr_140px_140px_180px_280px] gap-4 px-4 py-3 text-xs font-semibold text-foreground/60 border-b border-(--border-color) bg-foreground/5">
                        <span>{t("colTitle")}</span>
                        <span>{t("colStatus")}</span>
                        <span>{t("colType")}</span>
                        <span>{t("colWindow")}</span>
                        <span className="text-right">{t("colActions")}</span>
                    </div>
                    <div className="divide-y divide-(--border-color)">
                        {contests.map((c) => (
                            <div
                                key={c.id}
                                className="grid grid-cols-1 md:grid-cols-[2fr_140px_140px_180px_280px] gap-4 px-4 py-3 items-center"
                            >
                                <div className="min-w-0">
                                    <div className="font-medium truncate">{c.title}</div>
                                    <div className="text-xs text-foreground/50 truncate">/{c.slug}</div>
                                </div>
                                <div>
                                    <ContestStatusBadge status={c.status} />
                                </div>
                                <div>
                                    <ContestTypeBadge type={c.participation_type} />
                                </div>
                                <div className="text-xs text-foreground/70">
                                    <div>{formatDateRange(c.start_at, c.end_at)}</div>
                                    {c.stages && c.stages.length > 0 && (
                                        <div className="mt-1 text-foreground/50">
                                            {t("stagesCount", { count: c.stages.length })}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 justify-start md:justify-end">
                                    <Button
                                        size="sm"
                                        variant="utility"
                                        icon={<Users className="w-3.5 h-3.5" />}
                                        onClick={() => setViewingPanel(c)}
                                    >
                                        {t("registrations")}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="save"
                                        icon={<Pencil className="w-3.5 h-3.5" />}
                                        onClick={() => {
                                            setEditing(c);
                                            setShowForm(true);
                                        }}
                                    >
                                        {t("edit")}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        icon={<Trash2 className="w-3.5 h-3.5" />}
                                        onClick={() => setDeleting(c)}
                                    >
                                        {t("delete")}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showForm && (
                <ContestForm
                    contest={editing}
                    onClose={() => {
                        setShowForm(false);
                        setEditing(null);
                    }}
                    onSaved={() => {
                        setShowForm(false);
                        setEditing(null);
                        refresh();
                    }}
                />
            )}

            {deleting && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => !deletingBusy && setDeleting(null)}
                >
                    <div
                        className="w-full max-w-md rounded-lg border border-(--border-color) bg-background p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-2">{t("deleteConfirmTitle")}</h3>
                        <p className="text-sm text-foreground/70 mb-4">
                            {t("deleteConfirmBody", { title: deleting.title })}
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="cancel" onClick={() => setDeleting(null)} disabled={deletingBusy}>
                                {t("cancel")}
                            </Button>
                            <Button
                                variant="danger"
                                onClick={confirmDelete}
                                isLoading={deletingBusy}
                                loadingText={t("deleting")}
                            >
                                {t("deleteForever")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ContestManagementClient() {
    return (
        <ToastProvider>
            <ContestManagementWorkspace />
        </ToastProvider>
    );
}
