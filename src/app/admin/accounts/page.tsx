"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Button } from "@/components/features/admin/common/Button";
import ConfirmPopup from "@/components/features/admin/common/ConfirmPopup";
import type { User } from "@/types/user";

type AccountDraft = {
    id?: string;
    username: string;
    password: string;
    full_name: string;
    email: string;
    phone: string;
    school: string;
    role: "user" | "admin";
};

const EMPTY_DRAFT: AccountDraft = {
    username: "",
    password: "",
    full_name: "",
    email: "",
    phone: "",
    school: "",
    role: "user",
};

const PAGE_SIZE = 50;
const USERNAME_RE = /^[A-Za-z0-9_]{6,30}$/;
const PASSWORD_RE = /^\S{8,}$/;
const ACCOUNT_GRID_COLUMNS = "md:grid-cols-[1.08fr_0.92fr_0.52fr_106px_142px]";

type RoleFilter = "all" | "user" | "admin";
type AccountSort = "newest" | "oldest" | "usernameAsc" | "usernameDesc" | "nameAsc" | "role";

function AccountManagement() {
    const { showToast } = useToast();
    const t = useTranslations("accounts");
    const tCommon = useTranslations("common");
    const [accounts, setAccounts] = useState<User[]>([]);
    const [draft, setDraft] = useState<AccountDraft>(EMPTY_DRAFT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [sort, setSort] = useState<AccountSort>("newest");
    const [page, setPage] = useState(1);
    const [glowForm, setGlowForm] = useState(false);
    const formRef = useRef<HTMLElement>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/accounts", { cache: "no-store" });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || t("loadError"));
            setAccounts(json.data ?? []);
        } catch (err) {
            showToast("error", err instanceof Error ? err.message : t("loadError"));
        } finally {
            setLoading(false);
        }
    }, [showToast, t]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        setPage(1);
    }, [search, roleFilter, sort]);

    function edit(account: User) {
        setDraft({
            id: account.id,
            username: account.username,
            password: "",
            full_name: account.full_name,
            email: account.email ?? "",
            phone: account.phone ?? "",
            school: account.school ?? "",
            role: account.role,
        });
        setGlowForm(true);
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.setTimeout(() => setGlowForm(false), 900);
    }

    function updateDraft(patch: Partial<AccountDraft>) {
        setDraft((current) => {
            const next = { ...current, ...patch };
            if (patch.role === "admin") next.school = "";
            return next;
        });
    }

    async function save() {
        const passwordRequired = !draft.id;
        const passwordProvided = draft.password.length > 0;
        if (!draft.username.trim() || !draft.full_name.trim() || (passwordRequired && !draft.password)) {
            showToast("warning", t("requiredWarning"));
            return;
        }
        if (!USERNAME_RE.test(draft.username.trim())) {
            showToast("warning", t("usernameInvalid"));
            return;
        }
        if ((passwordRequired || passwordProvided) && !PASSWORD_RE.test(draft.password)) {
            showToast("warning", t("passwordInvalid"));
            return;
        }
        setSaving(true);
        try {
            const body: Record<string, string | null> = {
                username: draft.username,
                full_name: draft.full_name,
                email: draft.email,
                phone: draft.phone,
                school: draft.role === "admin" ? null : draft.school,
                role: draft.role,
            };
            if (passwordRequired || passwordProvided) body.password = draft.password;
            const res = await fetch(draft.id ? `/api/admin/accounts/${draft.id}` : "/api/admin/accounts", {
                method: draft.id ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || t("saveError"));
            showToast("success", draft.id ? t("updateSuccess") : t("createSuccess"));
            setDraft(EMPTY_DRAFT);
            refresh();
        } catch (err) {
            showToast("error", err instanceof Error ? err.message : t("saveError"));
        } finally {
            setSaving(false);
        }
    }

    async function remove(id: string) {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || t("deleteError"));
            showToast("success", t("deleteSuccess"));
            setDeleteTarget(null);
            refresh();
        } catch (err) {
            showToast("error", err instanceof Error ? err.message : t("deleteError"));
        } finally {
            setDeletingId(null);
        }
    }

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const result = accounts.filter((account) => {
            if (roleFilter !== "all" && account.role !== roleFilter) return false;
            if (!q) return true;
            return [
                account.username,
                account.full_name,
                account.email,
                account.phone,
                account.school,
            ].some((value) => value?.toLowerCase().includes(q));
        });

        result.sort((a, b) => {
            if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sort === "usernameAsc") return a.username.localeCompare(b.username);
            if (sort === "usernameDesc") return b.username.localeCompare(a.username);
            if (sort === "nameAsc") return a.full_name.localeCompare(b.full_name);
            if (sort === "role") return a.role.localeCompare(b.role) || a.username.localeCompare(b.username);
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        return result;
    }, [accounts, roleFilter, search, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <header className="mb-6">
                <h1 className="text-2xl font-bold tracking-widest text-accent">{t("title")}</h1>
                <p className="text-sm text-foreground/70 mt-0.5">
                    {t("subtitle")}
                </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <section
                    ref={formRef}
                    className={`h-fit rounded-lg border bg-(--post-card) p-4 transition-shadow ${
                        glowForm ? "border-accent shadow-[0_0_0_3px_rgba(31,81,255,0.16),0_0_34px_rgba(31,81,255,0.22)]" : "border-(--border-color)"
                    }`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold uppercase tracking-widest">
                            {draft.id ? t("editTitle", { username: draft.username }) : t("createTitle")}
                        </h2>
                        {draft.id && (
                            <button
                                type="button"
                                onClick={() => setDraft(EMPTY_DRAFT)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-foreground/10"
                                aria-label={t("closeEdit")}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Field
                            required
                            label={t("username")}
                            value={draft.username}
                            onChange={(v) => updateDraft({ username: v })}
                            error={draft.username.length > 0 && !USERNAME_RE.test(draft.username) ? t("usernameInvalid") : undefined}
                        />
                        <Field
                            required={!draft.id}
                            label={draft.id ? t("newPassword") : t("password")}
                            value={draft.password}
                            type="password"
                            onChange={(v) => updateDraft({ password: v })}
                            error={draft.password.length > 0 && !PASSWORD_RE.test(draft.password) ? t("passwordInvalid") : undefined}
                        />
                        <Field required label={t("fullName")} value={draft.full_name} onChange={(v) => updateDraft({ full_name: v })} />
                        <Field label={t("email")} value={draft.email} type="email" onChange={(v) => updateDraft({ email: v })} />
                        <Field label={t("phone")} value={draft.phone} onChange={(v) => updateDraft({ phone: v })} />
                        {draft.role !== "admin" && (
                            <Field label={t("school")} value={draft.school} onChange={(v) => updateDraft({ school: v })} />
                        )}
                        <label className="block text-xs text-foreground/70">
                            {t("role")}
                            <select
                                value={draft.role}
                                onChange={(e) => updateDraft({ role: e.target.value as "user" | "admin" })}
                                className="mt-1 w-full rounded-md border border-(--border-color) bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                            >
                                <option value="user">{t("roleUser")}</option>
                                <option value="admin">{t("roleAdmin")}</option>
                            </select>
                        </label>
                    </div>

                    <Button
                        variant="primary"
                        icon={draft.id ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        onClick={save}
                        isLoading={saving}
                        loadingText={t("saving")}
                        fullWidth
                        className="mt-4"
                    >
                        {draft.id ? t("saveChanges") : t("createButton")}
                    </Button>
                </section>

                <section className="overflow-hidden rounded-lg border border-(--border-color) bg-(--post-card)">
                    <div className="flex flex-wrap items-center gap-2 border-b border-(--border-color) bg-foreground/5 px-3 py-2">
                        <div className="relative min-w-[220px] flex-1">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t("search")}
                                className="w-full rounded-md border border-(--border-color) bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-accent/50"
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                            className="rounded-md border border-(--border-color) bg-background px-2 py-1.5 text-xs outline-none"
                        >
                            <option value="all">{t("filterAll")}</option>
                            <option value="user">{t("roleUser")}</option>
                            <option value="admin">{t("roleAdmin")}</option>
                        </select>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as AccountSort)}
                            className="rounded-md border border-(--border-color) bg-background px-2 py-1.5 text-xs outline-none"
                        >
                            <option value="newest">{t("sortNewest")}</option>
                            <option value="oldest">{t("sortOldest")}</option>
                            <option value="usernameAsc">{t("sortUsernameAsc")}</option>
                            <option value="usernameDesc">{t("sortUsernameDesc")}</option>
                            <option value="nameAsc">{t("sortNameAsc")}</option>
                            <option value="role">{t("sortRole")}</option>
                        </select>
                    </div>

                    <div className={`hidden md:grid ${ACCOUNT_GRID_COLUMNS} gap-2 px-3 py-2 text-[11px] font-semibold text-foreground/60 border-b border-(--border-color)`}>
                        <span>{t("colUsername")}</span>
                        <span>{t("colInfo")}</span>
                        <span>{t("colSchool")}</span>
                        <span>{t("colRole")}</span>
                        <span className="text-right">{t("colActions")}</span>
                    </div>
                    {loading ? (
                        <div className="p-8 text-sm text-foreground/60 text-center">{tCommon("loading")}</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-sm text-foreground/60 text-center">{t("empty")}</div>
                    ) : (
                        <div className="divide-y divide-(--border-color)">
                            {pageItems.map((account) => {
                                const isEditing = draft.id === account.id;
                                return (
                                    <div
                                        key={account.id}
                                        className={`grid grid-cols-1 items-start gap-2 px-3 py-2 text-[13px] transition-colors ${ACCOUNT_GRID_COLUMNS} ${
                                            isEditing ? "bg-accent/10 ring-1 ring-inset ring-accent" : ""
                                        }`}
                                    >
                                        <div className="font-medium">@{account.username}</div>
                                        <div className="min-w-0">
                                            <div className="break-words leading-snug">{account.full_name}</div>
                                            <div className="break-words text-[11px] leading-snug text-foreground/50">
                                                {[account.email, account.phone].filter(Boolean).join(" • ") || "—"}
                                            </div>
                                        </div>
                                        <div className="break-words text-xs leading-snug text-foreground/70">{account.school || "—"}</div>
                                        <div>
                                            <span className={`px-2 py-0.5 rounded text-[11px] ${account.role === "admin" ? "bg-red-500/15 text-red-400" : "bg-accent/15 text-accent"}`}>
                                                {account.role === "admin" ? t("roleAdmin") : t("roleUser")}
                                            </span>
                                        </div>
                                        <div className="flex justify-start gap-1.5 md:justify-end">
                                            <Button size="sm" variant="save" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => edit(account)}>
                                                {tCommon("edit")}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                icon={<Trash2 className="w-3.5 h-3.5" />}
                                                onClick={() => setDeleteTarget(account)}
                                                isLoading={deletingId === account.id}
                                                loadingText="..."
                                            >
                                                {tCommon("delete")}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-(--border-color) px-3 py-2 text-xs text-foreground/60">
                        <span>{t("showing", { shown: pageItems.length, total: filtered.length })}</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((value) => Math.max(1, value - 1))}
                                disabled={currentPage === 1}
                                className="inline-flex h-7 w-7 items-center justify-center rounded border border-(--border-color) disabled:opacity-40"
                                aria-label={t("previousPage")}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span>{t("pagination", { current: currentPage, total: totalPages })}</span>
                            <button
                                type="button"
                                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                                disabled={currentPage === totalPages}
                                className="inline-flex h-7 w-7 items-center justify-center rounded border border-(--border-color) disabled:opacity-40"
                                aria-label={t("nextPage")}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </section>
            </div>
            {deleteTarget && (
                <ConfirmPopup
                    variant="danger"
                    title={t("deleteConfirmTitle")}
                    message={t("deleteConfirmMessage")}
                    itemName={deleteTarget.username}
                    confirmText={tCommon("delete")}
                    cancelText={tCommon("cancel")}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={() => remove(deleteTarget.id)}
                />
            )}
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    type = "text",
    required = false,
    error,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    error?: string;
}) {
    return (
        <label className="block text-xs text-foreground/70">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
            <input
                type={type}
                value={value}
                required={required}
                onChange={(e) => onChange(e.target.value)}
                className={`mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 ${
                    error ? "border-red-500 focus:ring-red-500/50" : "border-(--border-color) focus:ring-accent/50"
                }`}
            />
            {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
        </label>
    );
}

export default function AccountsPage() {
    return (
        <ToastProvider>
            <AccountManagement />
        </ToastProvider>
    );
}
