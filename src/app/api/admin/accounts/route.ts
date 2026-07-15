import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api-helpers";
import { createUser, dbUserToUser, listUsers, type UserAdminInput } from "@/lib/users-db";

const USERNAME_RE = /^[A-Za-z0-9_]{6,30}$/;
const PASSWORD_RE = /^\S{8,}$/;

function normalizeUserInput(body: Record<string, unknown>, requirePassword: boolean): UserAdminInput | string {
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const full_name = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const role = body.role === "admin" ? "admin" : "user";
    if (!USERNAME_RE.test(username)) return "username must be 6-30 letters, numbers, or underscores";
    if (requirePassword && !PASSWORD_RE.test(password)) return "password must be at least 8 characters and contain no spaces";
    if (!full_name) return "full_name is required";
    return {
        username,
        password,
        full_name,
        email: typeof body.email === "string" && body.email.trim() ? body.email.trim() : null,
        phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null,
        school: typeof body.school === "string" && body.school.trim() ? body.school.trim() : null,
        role,
    };
}

export async function GET() {
    try {
        await requireAdmin();
        const supabase = createSupabaseAdminClient();
        const users = await listUsers(supabase);
        return apiSuccess(users.map(dbUserToUser));
    } catch (err) {
        return handleRouteError(err);
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
        const body = await req.json().catch(() => ({}));
        const input = normalizeUserInput(body, true);
        if (typeof input === "string") return apiError(input, 400);
        const supabase = createSupabaseAdminClient();
        const created = await createUser(supabase, input);
        return apiSuccess(dbUserToUser(created));
    } catch (err) {
        return handleRouteError(err);
    }
}
