import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
    getRegistration,
    isRegistrationMember,
    getContestById,
    createSubmission,
    listStages,
    getActiveSubmissionStage,
    listSubmissionsForRegistration,
    deleteSubmission,
} from "@/lib/contests-db";
import { uploadSubmissionFile, deleteSubmissionFile, MAX_SUBMISSION_BYTES } from "@/lib/storage";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
    try {
        const current = await requireAuth();
        const form = await req.formData();
        const file = form.get("file");
        const registrationIdRaw = form.get("registration_id");
        const note = form.get("note");

        if (!(file instanceof File)) return apiError("file required", 400);
        if (typeof registrationIdRaw !== "string") return apiError("registration_id required", 400);
        const registrationId = parseInt(registrationIdRaw, 10);
        if (Number.isNaN(registrationId)) return apiError("invalid registration_id", 400);
        if (file.size > MAX_SUBMISSION_BYTES) return apiError("file exceeds 5MB", 400);

        const supabase = createSupabaseAdminClient();
        const reg = await getRegistration(supabase, registrationId);
        if (!reg) return apiError("registration not found", 404);

        const member = await isRegistrationMember(supabase, registrationId, current.profile.id);
        if (!member) return apiError("Forbidden", 403);

        const contest = await getContestById(supabase, reg.contest_id);
        if (!contest) return apiError("contest not found", 404);

        const stages = await listStages(supabase, contest.id);
        const activeStage = getActiveSubmissionStage(stages);
        if (!activeStage) return apiError("no submission stage is currently active", 400);

        const existing = await listSubmissionsForRegistration(supabase, registrationId);
        if (existing.length > 0) {
            // Delete all previous submissions before accepting the new one.
            await Promise.all(
                existing.map(async (s) => {
                    await deleteSubmissionFile(supabase, s.storage_path);
                    await deleteSubmission(supabase, s.id);
                }),
            );
        }

        const { path } = await uploadSubmissionFile(supabase, {
            contestSlug: contest.slug,
            teamCode: reg.team_code,
            file,
        });

        const sub = await createSubmission(supabase, {
            registration_id: registrationId,
            storage_path: path,
            file_name: file.name,
            file_size_bytes: file.size,
            mime_type: file.type || "application/octet-stream",
            note: typeof note === "string" ? note : null,
            submitted_by: current.profile.id,
        });
        return apiSuccess(sub);
    } catch (err) {
        return handleRouteError(err);
    }
}
