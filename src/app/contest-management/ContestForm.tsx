"use client";

import { useEffect, useState } from "react";
import { X, FolderOpen, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/features/admin/common/Button";
import {
    FormField,
    FormInput,
    FormTextarea,
    FormSelectDropdown,
} from "@/components/features/admin/common/FormFields";
import BucketManager from "@/components/features/admin/tabs/BucketManager";
import { useToast } from "@/components/ui/Toast";
import type {
    DbContest,
    DbContestStage,
    ContestParticipationType,
    ContestStatus,
    ContestWithStages,
} from "@/types/database";

interface Props {
    contest: ContestWithStages | DbContest | null;
    onClose: () => void;
    onSaved: () => void;
}


interface StageDraft {
    id?: number;
    name: string;
    description: string;
    start_at: string; // datetime-local
    end_at: string;
    allow_registration: boolean;
    allow_submission: boolean;
    submission_type: string;
    prompt_text: string;
    display_order: number;
}

function slugify(input: string): string {
    return input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

function toLocalInput(iso: string | undefined | null): string {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return "";
    }
}

function fromLocalInput(local: string): string {
    if (!local) return "";
    return new Date(local).toISOString();
}

function emptyStage(order: number): StageDraft {
    return {
        name: "",
        description: "",
        start_at: "",
        end_at: "",
        allow_registration: false,
        allow_submission: false,
        submission_type: "",
        prompt_text: "",
        display_order: order,
    };
}

function stageFromDb(s: DbContestStage): StageDraft {
    return {
        id: s.id,
        name: s.name,
        description: s.description ?? "",
        start_at: toLocalInput(s.start_at),
        end_at: toLocalInput(s.end_at),
        allow_registration: s.allow_registration,
        allow_submission: s.allow_submission,
        submission_type: s.submission_type ?? "",
        prompt_text: s.prompt_text ?? "",
        display_order: s.display_order,
    };
}

export default function ContestForm({ contest, onClose, onSaved }: Props) {
    const { showToast } = useToast();
    const t = useTranslations("contestForm");
    const tType = useTranslations("contestType");
    const tStatus = useTranslations("contestStatus");

    const PARTICIPATION_OPTIONS = [
        { value: "individual", label: tType("individual") },
        { value: "team", label: tType("team") },
        { value: "both", label: tType("both") },
    ];

    const STATUS_OPTIONS = [
        { value: "draft", label: tStatus("draft") },
        { value: "active", label: tStatus("active") },
        { value: "closed", label: tStatus("closed") },
        { value: "cancelled", label: tStatus("cancelled") },
    ];

    const [saving, setSaving] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);

    const initialStages: StageDraft[] =
        contest && "stages" in contest && Array.isArray((contest as ContestWithStages).stages)
            ? (contest as ContestWithStages).stages.map(stageFromDb)
            : [];

    const [title, setTitle] = useState(contest?.title ?? "");
    const [slug, setSlug] = useState(contest?.slug ?? "");
    const [slugTouched, setSlugTouched] = useState(!!contest);
    const [description, setDescription] = useState(contest?.description ?? "");
    const [rules, setRules] = useState(contest?.rules ?? "");
    const [coverImageUrl, setCoverImageUrl] = useState(contest?.cover_image_url ?? "");
    const [participationType, setParticipationType] = useState<ContestParticipationType>(
        contest?.participation_type ?? "individual",
    );
    const [minTeamSize, setMinTeamSize] = useState<number>(contest?.min_team_size ?? 1);
    const [maxTeamSize, setMaxTeamSize] = useState<number>(contest?.max_team_size ?? 1);
    const [status, setStatus] = useState<ContestStatus>(
        // Normalize stored participation values before editing.
        ((contest?.status as string) === "open" || (contest?.status as string) === "ongoing"
            ? "active"
            : contest?.status) as ContestStatus ?? "draft",
    );
    const [startAt, setStartAt] = useState(toLocalInput(contest?.start_at));
    const [endAt, setEndAt] = useState(toLocalInput(contest?.end_at));
    const [stages, setStages] = useState<StageDraft[]>(initialStages);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slugTouched) setSlug(slugify(title));
    }, [title, slugTouched]);

    useEffect(() => {
        if (participationType === "individual") {
            if (minTeamSize !== 1) setMinTeamSize(1);
            if (maxTeamSize !== 1) setMaxTeamSize(1);
            return;
        }
        if (minTeamSize < 2) setMinTeamSize(2);
        if (maxTeamSize < 2) setMaxTeamSize(3);
    }, [participationType, minTeamSize, maxTeamSize]);

    function updateStage(idx: number, patch: Partial<StageDraft>) {
        setStages((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    }

    function addStage() {
        setStages((prev) => [...prev, emptyStage(prev.length)]);
    }

    function removeStage(idx: number) {
        setStages((prev) => prev.filter((_, i) => i !== idx));
    }

    function validate(): string | null {
        if (!title.trim()) return "Vui lòng nhập tiêu đề";
        if (!slug.trim()) return "Vui lòng nhập slug";
        if (!description.trim()) return "Vui lòng nhập mô tả";
        if (!startAt || !endAt) return "Vui lòng nhập mốc bắt đầu/kết thúc cuộc thi";
        const cStart = new Date(startAt).getTime();
        const cEnd = new Date(endAt).getTime();
        if (Number.isNaN(cStart) || Number.isNaN(cEnd)) return "Mốc thời gian không hợp lệ";
        if (!(cStart < cEnd)) return "Bắt đầu cuộc thi phải trước kết thúc cuộc thi";
        if (participationType === "individual" && (minTeamSize !== 1 || maxTeamSize !== 1)) {
            return "Cuộc thi cá nhân phải có min/max thành viên = 1";
        }
        if (participationType !== "individual" && minTeamSize < 2) {
            return "Cuộc thi đội phải có tối thiểu 2 thành viên";
        }
        if (participationType !== "individual" && maxTeamSize < minTeamSize) {
            return "Số thành viên tối đa không được nhỏ hơn tối thiểu";
        }
        for (const [i, s] of stages.entries()) {
            const label = `Giai đoạn ${i + 1}`;
            if (!s.name.trim()) return `${label}: thiếu tên`;
            if (!s.start_at || !s.end_at) return `${label}: thiếu mốc thời gian`;
            const ss = new Date(s.start_at).getTime();
            const se = new Date(s.end_at).getTime();
            if (Number.isNaN(ss) || Number.isNaN(se)) return `${label}: mốc thời gian không hợp lệ`;
            if (!(ss < se)) return `${label}: bắt đầu phải trước kết thúc`;
            if (ss < cStart || se > cEnd) return `${label}: phải nằm trong khung cuộc thi`;
        }
        return null;
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const err = validate();
        if (err) {
            setError(err);
            return;
        }
        setError(null);
        setSaving(true);
        try {
            const payload = {
                slug: slug.trim(),
                title: title.trim(),
                description: description.trim(),
                rules: rules.trim() || null,
                cover_image_url: coverImageUrl.trim() || null,
                participation_type: participationType,
                min_team_size: minTeamSize,
                max_team_size: maxTeamSize,
                start_at: fromLocalInput(startAt),
                end_at: fromLocalInput(endAt),
                status,
                stages: stages.map((s, i) => ({
                    name: s.name.trim(),
                    description: s.description.trim() || null,
                    start_at: fromLocalInput(s.start_at),
                    end_at: fromLocalInput(s.end_at),
                    allow_registration: s.allow_registration,
                    allow_submission: s.allow_submission,
                    submission_type: s.submission_type.trim() || null,
                    prompt_text: s.prompt_text.trim() || null,
                    display_order: i,
                })),
            };
            const url = contest ? `/api/admin/contests/${contest.id}` : "/api/admin/contests";
            const method = contest ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const ct = res.headers.get("content-type") ?? "";
            if (!ct.includes("application/json")) {
                throw new Error(
                    res.status === 401 || res.status === 403
                        ? t("sessionExpired")
                        : t("serverError", { status: res.status }),
                );
            }
            const json = await res.json();
            if (!json.success) throw new Error(json.message || t("saveFailed"));
            showToast("success", contest ? t("updateSuccess") : t("createSuccess"));
            onSaved();
        } catch (e2) {
            const message = e2 instanceof Error ? e2.message : t("saveFailed");
            setError(message);
            showToast("error", message);
        } finally {
            setSaving(false);
        }
    }

    const teamSizeInvalid = participationType !== "individual" && maxTeamSize < minTeamSize;
    const teamSizeHint = participationType === "individual" ? t("individualHint") : t("teamRangeHint");
    const teamSizeError = teamSizeInvalid ? t("teamSizeRangeError") : undefined;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-(--border-color) bg-background p-6 shadow-xl"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold tracking-widest text-accent">
                        {contest ? t("editTitle") : t("createTitle")}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded hover:bg-foreground/10 cursor-pointer"
                        aria-label={t("close")}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <FormField label={t("fieldTitle")} required>
                        <FormInput
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="VD: Kỳ thi Toán Mô Hình 2026"
                        />
                    </FormField>

                    <FormField label={t("fieldSlug")} required hint={t("slugHint")}>
                        <FormInput
                            type="text"
                            value={slug}
                            onChange={(e) => {
                                setSlug(e.target.value);
                                setSlugTouched(true);
                            }}
                            placeholder="ky-thi-toan-mo-hinh-2026"
                        />
                    </FormField>

                    <FormField label={t("fieldDescription")} required>
                        <FormTextarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Giới thiệu ngắn về cuộc thi"
                        />
                    </FormField>

                    <FormField label={t("fieldRules")} hint={t("rulesHint")}>
                        <FormTextarea
                            rows={5}
                            value={rules}
                            onChange={(e) => setRules(e.target.value)}
                            placeholder="Quy định, vòng thi, tiêu chí chấm..."
                        />
                    </FormField>

                    <FormField label={t("fieldCover")}>
                        <div className="space-y-2">
                            <FormInput
                                type="text"
                                value={coverImageUrl}
                                onChange={(e) => setCoverImageUrl(e.target.value)}
                                placeholder="https://... hoặc chọn từ bucket"
                            />
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPickerOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-(--border-color) bg-foreground/5 hover:bg-foreground/10 transition-colors cursor-pointer"
                                >
                                    <FolderOpen size={14} />
                                    {t("pickFromBucket")}
                                </button>
                            </div>
                        </div>
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField label={t("fieldParticipation")} required>
                            <FormSelectDropdown
                                options={PARTICIPATION_OPTIONS}
                                value={participationType}
                                onChange={(v) => setParticipationType(v as ContestParticipationType)}
                            />
                        </FormField>
                        <FormField
                            label={t("fieldMinTeamSize")}
                            required
                            hint={teamSizeHint}
                            error={teamSizeError}
                        >
                            <FormInput
                                type="number"
                                min={participationType === "individual" ? 1 : 2}
                                max={20}
                                restrictToPositiveInteger
                                hasError={teamSizeInvalid}
                                value={minTeamSize}
                                onChange={(e) =>
                                    setMinTeamSize(Math.max(1, parseInt(e.target.value || "1", 10)))
                                }
                                disabled={participationType === "individual"}
                            />
                        </FormField>
                        <FormField
                            label={t("fieldMaxTeamSize")}
                            required
                            hint={teamSizeHint}
                            error={teamSizeError}
                        >
                            <FormInput
                                type="number"
                                min={participationType === "individual" ? 1 : minTeamSize}
                                max={20}
                                restrictToPositiveInteger
                                hasError={teamSizeInvalid}
                                value={maxTeamSize}
                                onChange={(e) =>
                                    setMaxTeamSize(Math.max(1, parseInt(e.target.value || "1", 10)))
                                }
                                disabled={participationType === "individual"}
                            />
                        </FormField>
                    </div>

                    <fieldset className="rounded-md border border-(--border-color) p-4 space-y-3">
                        <legend className="px-2 text-xs uppercase tracking-widest text-(--foreground-dim)">
                            {t("grandTimeline")}
                        </legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label={t("grandStart")} required>
                                <FormInput
                                    type="datetime-local"
                                    value={startAt}
                                    onChange={(e) => setStartAt(e.target.value)}
                                />
                            </FormField>
                            <FormField label={t("grandEnd")} required>
                                <FormInput
                                    type="datetime-local"
                                    value={endAt}
                                    onChange={(e) => setEndAt(e.target.value)}
                                />
                            </FormField>
                        </div>
                        <p className="text-xs text-(--foreground-dim)">{t("grandHint")}</p>
                    </fieldset>

                    <fieldset className="rounded-md border border-(--border-color) p-4 space-y-3">
                        <legend className="px-2 text-xs uppercase tracking-widest text-(--foreground-dim)">
                            {t("stages", { count: stages.length })}
                        </legend>
                        {stages.length === 0 && (
                            <p className="text-sm text-(--foreground-dim)">{t("stagesEmpty")}</p>
                        )}
                        {stages.map((s, idx) => (
                            <div
                                key={idx}
                                className="rounded-md border border-(--border-color) p-3 space-y-3 bg-foreground/[0.02]"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="text-xs font-semibold text-accent">
                                        {t("stageNumber", { n: idx + 1 })}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeStage(idx)}
                                        className="p-1 rounded hover:bg-red-500/10 text-red-500 cursor-pointer"
                                        aria-label={t("deleteStage")}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <FormField label={t("stageName")} required>
                                    <FormInput
                                        type="text"
                                        value={s.name}
                                        onChange={(e) => updateStage(idx, { name: e.target.value })}
                                        placeholder={t("stageNamePlaceholder")}
                                    />
                                </FormField>
                                <FormField label={t("stageDescription")}>
                                    <FormTextarea
                                        rows={2}
                                        value={s.description}
                                        onChange={(e) =>
                                            updateStage(idx, { description: e.target.value })
                                        }
                                    />
                                </FormField>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField label={t("stageStart")} required>
                                        <FormInput
                                            type="datetime-local"
                                            value={s.start_at}
                                            onChange={(e) =>
                                                updateStage(idx, { start_at: e.target.value })
                                            }
                                        />
                                    </FormField>
                                    <FormField label={t("stageEnd")} required>
                                        <FormInput
                                            type="datetime-local"
                                            value={s.end_at}
                                            onChange={(e) =>
                                                updateStage(idx, { end_at: e.target.value })
                                            }
                                        />
                                    </FormField>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={s.allow_submission}
                                            onChange={(e) =>
                                                updateStage(idx, {
                                                    allow_submission: e.target.checked,
                                                })
                                            }
                                        />
                                        {t("allowSubmission")}
                                    </label>
                                </div>
                                {s.allow_submission && (
                                    <div className="space-y-3">
                                        <FormField label={t("submissionType")} hint={t("submissionTypeHint")}>
                                            <FormInput
                                                type="text"
                                                value={s.submission_type}
                                                onChange={(e) =>
                                                    updateStage(idx, {
                                                        submission_type: e.target.value,
                                                    })
                                                }
                                                placeholder="file"
                                            />
                                        </FormField>
                                        <FormField label={t("stagePrompt")} hint={t("stagePromptHint")}>
                                            <FormTextarea
                                                rows={3}
                                                value={s.prompt_text}
                                                onChange={(e) =>
                                                    updateStage(idx, {
                                                        prompt_text: e.target.value,
                                                    })
                                                }
                                                placeholder={t("stagePromptPlaceholder")}
                                            />
                                        </FormField>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addStage}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-(--border-color) bg-foreground/5 hover:bg-foreground/10 transition-colors cursor-pointer"
                        >
                            <Plus size={14} />
                            {t("addStage")}
                        </button>
                    </fieldset>

                    <FormField label={t("fieldStatus")} required>
                        <FormSelectDropdown
                            options={STATUS_OPTIONS}
                            value={status}
                            onChange={(v) => setStatus(v as ContestStatus)}
                        />
                    </FormField>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="cancel" onClick={onClose}>
                            {t("cancel")}
                        </Button>
                        <Button type="submit" variant="primary" isLoading={saving} loadingText={t("saving")}>
                            {contest ? t("saveChanges") : t("createButton")}
                        </Button>
                    </div>
                </form>

                {pickerOpen && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6"
                        onClick={() => setPickerOpen(false)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-background border border-(--border-color) rounded-lg w-full max-w-5xl h-[80vh] flex flex-col shadow-xl"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-(--border-color)">
                                <h2 className="text-lg font-semibold">{t("pickFromBucket")}</h2>
                                <button
                                    type="button"
                                    onClick={() => setPickerOpen(false)}
                                    className="p-1.5 rounded hover:bg-foreground/10 cursor-pointer text-foreground/60 hover:text-foreground transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden p-4">
                                <BucketManager
                                    initialBucket="post-images"
                                    allowBucketSwitch={false}
                                    mode="picker"
                                    onPick={(file) => {
                                        setCoverImageUrl(file.publicUrl);
                                        setPickerOpen(false);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
