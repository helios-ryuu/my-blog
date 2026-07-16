import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api-helpers";
import { getAdminUser, verifyAdminCredentials } from "@/lib/auth/admin";
import { createSessionPayload, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const username = typeof body.username === "string" ? body.username.trim() : "";
        const password = typeof body.password === "string" ? body.password : "";
        if (!username || !password) return apiError("Username and password are required", 400);
        if (username.length > 200 || password.length > 1024) return apiError("Credentials are too long", 400);
        if (!await verifyAdminCredentials(username, password)) {
            return apiError("Invalid username or password", 401);
        }

        const user = getAdminUser(username);
        const token = await signSession(createSessionPayload(user.username));
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
        return apiSuccess(user);
    } catch (err) {
        return handleRouteError(err);
    }
}
