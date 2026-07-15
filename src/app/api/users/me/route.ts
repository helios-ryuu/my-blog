import { NextRequest } from "next/server";
import { createSupabaseServerClient, requireAuth } from "@/lib/supabase/server";
import { apiSuccess, apiError, handleRouteError } from "@/lib/api-helpers";
import { updateUserProfile, dbUserToUser } from "@/lib/users-db";

const LIMITS = {
    full_name: 100,
    email: 200,
    phone: 30,
    school: 200,
} as const;

const LABELS: Record<keyof typeof LIMITS, string> = {
    full_name: "Họ và tên",
    email: "Email",
    phone: "Số điện thoại",
    school: "Trường/Tổ chức",
};

function normalize(value: unknown): string | null | undefined {
    if (value === null) return null;
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
}

export async function GET() {
    try {
        const current = await requireAuth();
        return apiSuccess(dbUserToUser(current.profile));
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const current = await requireAuth();
        if (current.profile.role !== "admin") {
            return apiError("Chỉ admin được cập nhật thông tin cá nhân.", 403);
        }
        const body = await req.json().catch(() => ({}));
        const patch: { full_name?: string; email?: string | null; phone?: string | null; school?: string | null } = {};

        for (const key of ["full_name", "email", "phone", "school"] as const) {
            if (!(key in body)) continue;
            const value = normalize(body[key]);
            if (value === undefined || (key === "full_name" && value === null)) {
                return apiError(`${LABELS[key]} không hợp lệ`, 400);
            }
            if (value !== null && value.length > LIMITS[key]) {
                return apiError(`${LABELS[key]} không vượt quá ${LIMITS[key]} ký tự`, 400);
            }
            patch[key] = value as never;
        }

        const supabase = await createSupabaseServerClient();
        const updated = await updateUserProfile(supabase, current.profile.id, patch);
        return apiSuccess(dbUserToUser(updated));
    } catch (err) {
        return handleRouteError(err);
    }
}
