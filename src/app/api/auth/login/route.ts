import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api-helpers";
import { dbUserToUser, getUserByCredentials } from "@/lib/users-db";
import { createSessionPayload, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";

const USERNAME_RE = /^[A-Za-z0-9_]{6,30}$/;
const PASSWORD_RE = /^\S{8,}$/;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";
        if (!username || !password) return apiError("Username and password are required", 400);
        if (!USERNAME_RE.test(username) || !PASSWORD_RE.test(password)) {
            return apiError("Invalid username or password", 401);
        }

        const supabase = createSupabaseAdminClient();
        const user = await getUserByCredentials(supabase, username, password);
        if (!user) return apiError("Invalid username or password", 401);

        const token = await signSession(createSessionPayload(user.id, user.role));
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
        return apiSuccess(dbUserToUser(user));
    } catch (err) {
        return handleRouteError(err);
    }
}
