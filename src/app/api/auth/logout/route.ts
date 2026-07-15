import { apiMessage } from "@/lib/api-helpers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { cookies } from "next/headers";

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    return apiMessage("Logged out");
}
