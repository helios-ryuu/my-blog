import type { SupabaseClient } from "@supabase/supabase-js";
import type {
    DbContest,
    DbContestStage,
    DbContestRegistration,
    DbRegistrationMember,
    DbSubmission,
    ContestParticipationType,
    ContestStatus,
    ContestWithStages,
} from "@/types/database";

const CONTEST_FIELDS = "id, slug, title, description, rules, cover_image_url, participation_type, min_team_size, max_team_size, start_at, end_at, status, created_at, updated_at";
const STAGE_FIELDS = "id, contest_id, name, description, start_at, end_at, allow_registration, allow_submission, submission_type, prompt_text, display_order, created_at, updated_at";

export async function listContests(
    supabase: SupabaseClient,
    opts: { status?: ContestStatus; includeAll?: boolean; withStages?: boolean } = {},
): Promise<(DbContest | ContestWithStages)[]> {
    let query = supabase.from("contest").select(CONTEST_FIELDS).order("start_at", { ascending: false });
    if (opts.status) query = query.eq("status", opts.status);
    else if (!opts.includeAll) query = query.neq("status", "draft");
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const contests = (data ?? []) as DbContest[];
    if (!opts.withStages) return contests;
    return Promise.all(contests.map(async (c) => ({ ...c, stages: await listStages(supabase, c.id) })));
}

export async function getContestBySlug(
    supabase: SupabaseClient,
    slug: string,
    includeDraft = false,
): Promise<ContestWithStages | null> {
    let query = supabase.from("contest").select(CONTEST_FIELDS).eq("slug", slug);
    if (!includeDraft) query = query.neq("status", "draft");
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const contest = data as DbContest;
    return { ...contest, stages: await listStages(supabase, contest.id) };
}

export async function getContestById(
    supabase: SupabaseClient,
    id: number,
): Promise<DbContest | null> {
    const { data, error } = await supabase.from("contest").select(CONTEST_FIELDS).eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as DbContest) ?? null;
}

export async function getContestWithStagesById(
    supabase: SupabaseClient,
    id: number,
): Promise<ContestWithStages | null> {
    const contest = await getContestById(supabase, id);
    if (!contest) return null;
    return { ...contest, stages: await listStages(supabase, id) };
}

export interface ContestInput {
    slug: string;
    title: string;
    description: string;
    rules?: string | null;
    cover_image_url?: string | null;
    participation_type: ContestParticipationType;
    min_team_size: number;
    max_team_size: number;
    start_at: string;
    end_at: string;
    status?: ContestStatus;
}

function validateContest(input: ContestInput): string | null {
    if (input.participation_type === "individual" && (input.min_team_size !== 1 || input.max_team_size !== 1)) {
        return "individual contests must have min_team_size = max_team_size = 1";
    }
    if (input.participation_type !== "individual") {
        if (input.min_team_size < 2) return "team/both contests must have min_team_size >= 2";
        if (input.max_team_size < input.min_team_size) return "max_team_size must be greater than or equal to min_team_size";
    }
    const start = new Date(input.start_at);
    const end = new Date(input.end_at);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "invalid date(s)";
    if (!(start < end)) return "date order invalid: start_at must be before end_at";
    return null;
}

export async function createContest(
    supabase: SupabaseClient,
    input: ContestInput,
): Promise<DbContest> {
    const err = validateContest(input);
    if (err) throw new Error(err);
    const { data, error } = await supabase.from("contest").insert(input).select(CONTEST_FIELDS).single();
    if (error) throw new Error(error.message);
    return data as DbContest;
}

export async function updateContest(
    supabase: SupabaseClient,
    id: number,
    patch: Partial<ContestInput>,
): Promise<DbContest> {
    if (
        patch.participation_type !== undefined ||
        patch.min_team_size !== undefined ||
        patch.max_team_size !== undefined ||
        patch.start_at !== undefined ||
        patch.end_at !== undefined
    ) {
        const existing = await getContestById(supabase, id);
        if (!existing) throw new Error("contest not found");
        const merged: ContestInput = {
            slug: patch.slug ?? existing.slug,
            title: patch.title ?? existing.title,
            description: patch.description ?? existing.description,
            rules: patch.rules ?? existing.rules,
            cover_image_url: patch.cover_image_url ?? existing.cover_image_url,
            participation_type: patch.participation_type ?? existing.participation_type,
            min_team_size: patch.min_team_size ?? existing.min_team_size,
            max_team_size: patch.max_team_size ?? existing.max_team_size,
            start_at: patch.start_at ?? existing.start_at,
            end_at: patch.end_at ?? existing.end_at,
            status: patch.status ?? existing.status,
        };
        const err = validateContest(merged);
        if (err) throw new Error(err);
    }
    const { data, error } = await supabase.from("contest").update(patch).eq("id", id).select(CONTEST_FIELDS).single();
    if (error) throw new Error(error.message);
    return data as DbContest;
}

export async function deleteContest(
    supabase: SupabaseClient,
    id: number,
): Promise<void> {
    const { error } = await supabase.from("contest").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

// ---------- Stages ----------

export interface StageInput {
    name: string;
    description?: string | null;
    start_at: string;
    end_at: string;
    allow_registration?: boolean;
    allow_submission?: boolean;
    submission_type?: string | null;
    prompt_text?: string | null;
    display_order?: number;
}

function validateStage(stage: StageInput, contest: { start_at: string; end_at: string }): string | null {
    const cStart = new Date(contest.start_at).getTime();
    const cEnd = new Date(contest.end_at).getTime();
    const sStart = new Date(stage.start_at).getTime();
    const sEnd = new Date(stage.end_at).getTime();
    if ([cStart, cEnd, sStart, sEnd].some(Number.isNaN)) return "invalid stage date(s)";
    if (!(sStart < sEnd)) return "stage start_at must be before end_at";
    if (sStart < cStart || sEnd > cEnd) return "stage must be within contest grand timeline";
    if (!stage.name?.trim()) return "stage name is required";
    return null;
}

export async function listStages(
    supabase: SupabaseClient,
    contestId: number,
): Promise<DbContestStage[]> {
    const { data, error } = await supabase
        .from("contest_stage")
        .select(STAGE_FIELDS)
        .eq("contest_id", contestId)
        .order("display_order", { ascending: true })
        .order("start_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as DbContestStage[];
}

export async function createStage(
    supabase: SupabaseClient,
    contestId: number,
    input: StageInput,
): Promise<DbContestStage> {
    const contest = await getContestById(supabase, contestId);
    if (!contest) throw new Error("contest not found");
    const err = validateStage(input, contest);
    if (err) throw new Error(err);
    const { data, error } = await supabase
        .from("contest_stage")
        .insert({ ...input, contest_id: contestId })
        .select(STAGE_FIELDS)
        .single();
    if (error) throw new Error(error.message);
    return data as DbContestStage;
}

export async function updateStage(
    supabase: SupabaseClient,
    stageId: number,
    patch: Partial<StageInput>,
): Promise<DbContestStage> {
    const { data: existing, error: getErr } = await supabase
        .from("contest_stage")
        .select(STAGE_FIELDS)
        .eq("id", stageId)
        .maybeSingle();
    if (getErr) throw new Error(getErr.message);
    if (!existing) throw new Error("stage not found");
    const stage = existing as DbContestStage;
    const contest = await getContestById(supabase, stage.contest_id);
    if (!contest) throw new Error("contest not found");
    const merged: StageInput = {
        name: patch.name ?? stage.name,
        description: patch.description ?? stage.description,
        start_at: patch.start_at ?? stage.start_at,
        end_at: patch.end_at ?? stage.end_at,
        allow_registration: patch.allow_registration ?? stage.allow_registration,
        allow_submission: patch.allow_submission ?? stage.allow_submission,
        submission_type: patch.submission_type ?? stage.submission_type,
        prompt_text: patch.prompt_text ?? stage.prompt_text,
        display_order: patch.display_order ?? stage.display_order,
    };
    const err = validateStage(merged, contest);
    if (err) throw new Error(err);
    const { data, error } = await supabase
        .from("contest_stage")
        .update(patch)
        .eq("id", stageId)
        .select(STAGE_FIELDS)
        .single();
    if (error) throw new Error(error.message);
    return data as DbContestStage;
}

export async function deleteStage(
    supabase: SupabaseClient,
    stageId: number,
): Promise<void> {
    const { error } = await supabase.from("contest_stage").delete().eq("id", stageId);
    if (error) throw new Error(error.message);
}

// Replace all stages for a contest in one shot. Used by the admin form to keep
// the stage list in sync with what the user submits.
export async function replaceStages(
    supabase: SupabaseClient,
    contestId: number,
    stages: StageInput[],
): Promise<DbContestStage[]> {
    const contest = await getContestById(supabase, contestId);
    if (!contest) throw new Error("contest not found");
    for (const s of stages) {
        const err = validateStage(s, contest);
        if (err) throw new Error(err);
    }
    const { error: delErr } = await supabase.from("contest_stage").delete().eq("contest_id", contestId);
    if (delErr) throw new Error(delErr.message);
    if (stages.length === 0) return [];
    const rows = stages.map((s, i) => ({
        contest_id: contestId,
        name: s.name,
        description: s.description ?? null,
        start_at: s.start_at,
        end_at: s.end_at,
        allow_registration: s.allow_registration ?? false,
        allow_submission: s.allow_submission ?? false,
        submission_type: s.submission_type ?? null,
        prompt_text: s.prompt_text ?? null,
        display_order: s.display_order ?? i,
    }));
    const { data, error } = await supabase.from("contest_stage").insert(rows).select(STAGE_FIELDS);
    if (error) throw new Error(error.message);
    return (data ?? []) as DbContestStage[];
}

// Returns true if `now` falls within at least one stage where the given
// capability flag is enabled.
export function isCapabilityActive(
    stages: DbContestStage[],
    capability: "allow_registration" | "allow_submission",
    now: Date = new Date(),
): boolean {
    const t = now.getTime();
    return stages.some(
        (s) => s[capability] && new Date(s.start_at).getTime() <= t && t <= new Date(s.end_at).getTime(),
    );
}

// Returns the first active submission stage, or null.
export function getActiveSubmissionStage(
    stages: DbContestStage[],
    now: Date = new Date(),
): DbContestStage | null {
    const t = now.getTime();
    return (
        stages.find(
            (s) => s.allow_submission && new Date(s.start_at).getTime() <= t && t <= new Date(s.end_at).getTime(),
        ) ?? null
    );
}

// Returns the latest end_at among stages where allow_submission=true and the
// stage is currently active. Used as the effective submission deadline.
export function activeSubmissionDeadline(
    stages: DbContestStage[],
    now: Date = new Date(),
): Date | null {
    const t = now.getTime();
    const active = stages.filter(
        (s) => s.allow_submission && new Date(s.start_at).getTime() <= t && t <= new Date(s.end_at).getTime(),
    );
    if (active.length === 0) return null;
    return new Date(Math.max(...active.map((s) => new Date(s.end_at).getTime())));
}

// ---------- Registrations ----------

export async function userHasRegistration(
    supabase: SupabaseClient,
    contestId: number,
    userId: string,
): Promise<boolean> {
    const { data: regs } = await supabase
        .from("contest_registration")
        .select("id")
        .eq("contest_id", contestId);
    const ids = ((regs ?? []) as Array<{ id: number }>).map((r) => r.id);
    if (ids.length === 0) return false;
    const { data: members } = await supabase
        .from("registration_member")
        .select("registration_id")
        .eq("user_id", userId)
        .in("registration_id", ids);
    return ((members as unknown[] | null)?.length ?? 0) > 0;
}

export async function createRegistration(
    supabase: SupabaseClient,
    args: { contest: DbContest; leaderId: string; teamName?: string | null; memberIds: string[] },
): Promise<{ registration: DbContestRegistration; members: DbRegistrationMember[] }> {
    const { contest, leaderId, teamName, memberIds } = args;
    if (contest.status !== "active") throw new Error("contest is not active");
    const stages = await listStages(supabase, contest.id);
    if (!isCapabilityActive(stages, "allow_registration")) {
        throw new Error("no registration stage is currently active");
    }

    const allMembers = Array.from(new Set([leaderId, ...memberIds]));
    const teamSize = allMembers.length;

    if (contest.participation_type === "individual" && teamSize !== 1) {
        throw new Error("individual contest accepts only one member");
    }
    if (contest.participation_type === "team" && teamSize < contest.min_team_size) {
        throw new Error(`team requires at least ${contest.min_team_size} members`);
    }
    if (contest.participation_type === "both" && teamSize !== 1 && teamSize < contest.min_team_size) {
        throw new Error(`team requires either 1 member or at least ${contest.min_team_size} members`);
    }
    if (teamSize > contest.max_team_size) {
        throw new Error(`team exceeds max size ${contest.max_team_size}`);
    }

    for (const uid of allMembers) {
        if (await userHasRegistration(supabase, contest.id, uid)) {
            throw new Error(`user ${uid} already registered for this contest`);
        }
    }

    const { data: reg, error: regErr } = await supabase
        .from("contest_registration")
        .insert({
            contest_id: contest.id,
            team_code: `TEAM${Date.now().toString(36).toUpperCase()}`,
            team_name: teamName ?? null,
            status: "approved",
        })
        .select("*")
        .single();
    if (regErr) throw new Error(regErr.message);
    const registration = reg as DbContestRegistration;

    const memberRows = allMembers.map((uid) => ({
        registration_id: registration.id,
        user_id: uid,
        role: uid === leaderId ? ("leader" as const) : ("member" as const),
    }));
    const { data: members, error: memErr } = await supabase
        .from("registration_member")
        .insert(memberRows)
        .select("*");
    if (memErr) {
        await supabase.from("contest_registration").delete().eq("id", registration.id);
        throw new Error(memErr.message);
    }

    return { registration, members: (members ?? []) as DbRegistrationMember[] };
}

export interface AdminRegistrationInput {
    team_code: string;
    team_name?: string | null;
    level?: string | null;
    leader_id: string;
    member_ids: string[];
}

function normalizeMemberRows(registrationId: number, leaderId: string, memberIds: string[]) {
    const allMembers = Array.from(new Set([leaderId, ...memberIds]));
    return allMembers.map((uid) => ({
        registration_id: registrationId,
        user_id: uid,
        role: uid === leaderId ? ("leader" as const) : ("member" as const),
    }));
}

export async function createAdminRegistration(
    supabase: SupabaseClient,
    contestId: number,
    input: AdminRegistrationInput,
): Promise<{ registration: DbContestRegistration; members: DbRegistrationMember[] }> {
    if (!input.team_code.trim()) throw new Error("team_code is required");
    if (!input.leader_id) throw new Error("leader_id is required");
    const rows = normalizeMemberRows(0, input.leader_id, input.member_ids);
    const contest = await getContestById(supabase, contestId);
    if (!contest) throw new Error("contest not found");
    if (contest.participation_type === "individual" && rows.length !== 1) {
        throw new Error("individual contest accepts only one member");
    }
    if (contest.participation_type === "team" && rows.length < contest.min_team_size) {
        throw new Error(`team requires at least ${contest.min_team_size} members`);
    }
    if (contest.participation_type === "both" && rows.length !== 1 && rows.length < contest.min_team_size) {
        throw new Error(`team requires either 1 member or at least ${contest.min_team_size} members`);
    }
    if (rows.length > contest.max_team_size) throw new Error(`team exceeds max size ${contest.max_team_size}`);

    const { data: reg, error: regErr } = await supabase
        .from("contest_registration")
        .insert({
            contest_id: contestId,
            team_code: input.team_code.trim(),
            team_name: input.team_name ?? null,
            level: input.level ?? null,
            status: "approved",
        })
        .select("*")
        .single();
    if (regErr) throw new Error(regErr.message);
    const registration = reg as DbContestRegistration;

    const memberRows = normalizeMemberRows(registration.id, input.leader_id, input.member_ids);
    const { data: members, error: memErr } = await supabase
        .from("registration_member")
        .insert(memberRows)
        .select("*");
    if (memErr) {
        await supabase.from("contest_registration").delete().eq("id", registration.id);
        throw new Error(memErr.message);
    }

    return { registration, members: (members ?? []) as DbRegistrationMember[] };
}

export async function getRegistration(
    supabase: SupabaseClient,
    id: number,
): Promise<DbContestRegistration | null> {
    const { data, error } = await supabase
        .from("contest_registration")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as DbContestRegistration) ?? null;
}

export interface DbRegistrationMemberWithUser extends DbRegistrationMember {
    users?: {
        username: string;
        full_name: string;
        email: string | null;
        phone: string | null;
        school: string | null;
    };
}

export async function getRegistrationMembers(
    supabase: SupabaseClient,
    registrationId: number,
): Promise<DbRegistrationMemberWithUser[]> {
    const { data, error } = await supabase
        .from("registration_member")
        .select("*, users(username, full_name, email, phone, school)")
        .eq("registration_id", registrationId);
    if (error) throw new Error(error.message);
    return (data ?? []) as DbRegistrationMemberWithUser[];
}

export async function isRegistrationLeader(
    supabase: SupabaseClient,
    registrationId: number,
    userId: string,
): Promise<boolean> {
    const { data } = await supabase
        .from("registration_member")
        .select("role")
        .eq("registration_id", registrationId)
        .eq("user_id", userId)
        .maybeSingle();
    return (data as { role: string } | null)?.role === "leader";
}

export async function isRegistrationMember(
    supabase: SupabaseClient,
    registrationId: number,
    userId: string,
): Promise<boolean> {
    const reg = await getRegistration(supabase, registrationId);
    if (!reg) return false;
    const { data } = await supabase
        .from("registration_member")
        .select("user_id")
        .eq("registration_id", registrationId)
        .eq("user_id", userId)
        .maybeSingle();
    return !!data;
}

export async function updateRegistrationTeam(
    supabase: SupabaseClient,
    registrationId: number,
    patch: { team_name?: string | null; member_ids?: string[]; leaderId: string },
): Promise<DbContestRegistration> {
    const reg = await getRegistration(supabase, registrationId);
    if (!reg) throw new Error("registration not found");
    if (patch.member_ids) {
        const contest = await getContestById(supabase, reg.contest_id);
        if (!contest) throw new Error("contest not found");
        const all = Array.from(new Set([patch.leaderId, ...patch.member_ids]));
        if (contest.participation_type === "individual" && all.length !== 1) {
            throw new Error("individual contest accepts only one member");
        }
        if (contest.participation_type === "team" && all.length < contest.min_team_size) {
            throw new Error(`team requires at least ${contest.min_team_size} members`);
        }
        if (contest.participation_type === "both" && all.length !== 1 && all.length < contest.min_team_size) {
            throw new Error(`team requires either 1 member or at least ${contest.min_team_size} members`);
        }
        if (all.length > contest.max_team_size) {
            throw new Error(`team exceeds max size ${contest.max_team_size}`);
        }
        await supabase.from("registration_member").delete().eq("registration_id", registrationId);
        const rows = all.map((uid) => ({
            registration_id: registrationId,
            user_id: uid,
            role: uid === patch.leaderId ? ("leader" as const) : ("member" as const),
        }));
        const { error } = await supabase.from("registration_member").insert(rows);
        if (error) throw new Error(error.message);
    }

    if (patch.team_name !== undefined) {
        const { data, error } = await supabase
            .from("contest_registration")
            .update({ team_name: patch.team_name })
            .eq("id", registrationId)
            .select("*")
            .single();
        if (error) throw new Error(error.message);
        return data as DbContestRegistration;
    }
    return (await getRegistration(supabase, registrationId))!;
}

export async function updateAdminRegistration(
    supabase: SupabaseClient,
    registrationId: number,
    patch: Partial<AdminRegistrationInput>,
): Promise<DbContestRegistration> {
    const reg = await getRegistration(supabase, registrationId);
    if (!reg) throw new Error("registration not found");

    if (patch.leader_id || patch.member_ids) {
        const leaderId = patch.leader_id;
        if (!leaderId) throw new Error("leader_id is required when updating members");
        const memberIds = patch.member_ids ?? [];
        const contest = await getContestById(supabase, reg.contest_id);
        if (!contest) throw new Error("contest not found");
        const memberRows = normalizeMemberRows(registrationId, leaderId, memberIds);
        if (contest.participation_type === "individual" && memberRows.length !== 1) {
            throw new Error("individual contest accepts only one member");
        }
        if (contest.participation_type === "team" && memberRows.length < contest.min_team_size) {
            throw new Error(`team requires at least ${contest.min_team_size} members`);
        }
        if (contest.participation_type === "both" && memberRows.length !== 1 && memberRows.length < contest.min_team_size) {
            throw new Error(`team requires either 1 member or at least ${contest.min_team_size} members`);
        }
        if (memberRows.length > contest.max_team_size) throw new Error(`team exceeds max size ${contest.max_team_size}`);
        await supabase.from("registration_member").delete().eq("registration_id", registrationId);
        const { error } = await supabase.from("registration_member").insert(memberRows);
        if (error) throw new Error(error.message);
    }

    const regPatch: Partial<DbContestRegistration> = {};
    if (patch.team_code !== undefined) regPatch.team_code = patch.team_code;
    if (patch.team_name !== undefined) regPatch.team_name = patch.team_name;
    if (patch.level !== undefined) regPatch.level = patch.level;
    regPatch.status = "approved";

    if (Object.keys(regPatch).length === 0) return (await getRegistration(supabase, registrationId))!;

    const { data, error } = await supabase
        .from("contest_registration")
        .update(regPatch)
        .eq("id", registrationId)
        .select("*")
        .single();
    if (error) throw new Error(error.message);
    return data as DbContestRegistration;
}

export async function deleteRegistration(
    supabase: SupabaseClient,
    registrationId: number,
): Promise<void> {
    const { error } = await supabase.from("contest_registration").delete().eq("id", registrationId);
    if (error) throw new Error(error.message);
}

export async function listRegistrationsForContest(
    supabase: SupabaseClient,
    contestId: number,
): Promise<DbContestRegistration[]> {
    const { data, error } = await supabase
        .from("contest_registration")
        .select("*")
        .eq("contest_id", contestId)
        .order("registered_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as DbContestRegistration[];
}

// ---------- Submissions ----------

export async function listSubmissionsForRegistration(
    supabase: SupabaseClient,
    registrationId: number,
): Promise<DbSubmission[]> {
    const { data, error } = await supabase
        .from("submission")
        .select("*")
        .eq("registration_id", registrationId)
        .order("submitted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as DbSubmission[];
}

export async function listSubmissionsForContest(
    supabase: SupabaseClient,
    contestId: number,
): Promise<DbSubmission[]> {
    const { data: regs } = await supabase
        .from("contest_registration")
        .select("id")
        .eq("contest_id", contestId);
    const ids = ((regs ?? []) as Array<{ id: number }>).map((r) => r.id);
    if (ids.length === 0) return [];
    const { data, error } = await supabase
        .from("submission")
        .select("*")
        .in("registration_id", ids)
        .order("submitted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as DbSubmission[];
}

export async function getSubmission(
    supabase: SupabaseClient,
    id: number,
): Promise<DbSubmission | null> {
    const { data, error } = await supabase.from("submission").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as DbSubmission) ?? null;
}

export async function createSubmission(
    supabase: SupabaseClient,
    input: Omit<DbSubmission, "id" | "submitted_at" | "is_final"> & { is_final?: boolean },
): Promise<DbSubmission> {
    const { data, error } = await supabase
        .from("submission")
        .insert({ ...input, is_final: input.is_final ?? false })
        .select("*")
        .single();
    if (error) throw new Error(error.message);
    return data as DbSubmission;
}

export async function markSubmissionFinal(
    supabase: SupabaseClient,
    submissionId: number,
): Promise<DbSubmission> {
    const sub = await getSubmission(supabase, submissionId);
    if (!sub) throw new Error("submission not found");
    await supabase
        .from("submission")
        .update({ is_final: false })
        .eq("registration_id", sub.registration_id)
        .neq("id", submissionId);
    const { data, error } = await supabase
        .from("submission")
        .update({ is_final: true })
        .eq("id", submissionId)
        .select("*")
        .single();
    if (error) throw new Error(error.message);
    return data as DbSubmission;
}

export async function deleteSubmission(
    supabase: SupabaseClient,
    id: number,
): Promise<void> {
    const { error } = await supabase.from("submission").delete().eq("id", id);
    if (error) throw new Error(error.message);
}
