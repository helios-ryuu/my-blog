import { cookies } from "next/headers";
import { getAdminUser } from "@/lib/auth/admin";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
    if (!session) return null;

    return getAdminUser(session.username);
}

export async function requireAdmin() {
    const current = await getCurrentUser();
    if (!current) throw new Error("UNAUTHORIZED");
    return current;
}
