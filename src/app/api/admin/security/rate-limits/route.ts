import { NextRequest } from "next/server";
import { apiError, apiSuccess, handleRouteError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/supabase/server";
import { getClientIp, listBlockedIps, unblockIp } from "@/lib/auth/rate-limit";

export async function GET(request: NextRequest) {
    try {
        await requireAdmin();
        const currentIp = getClientIp(request);
        const entries = await listBlockedIps();
        return apiSuccess({ currentIp, entries });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const body = await request.json().catch(() => ({}));
        const ip = typeof body.ip === "string" ? body.ip.trim() : "";
        if (!ip) return apiError("IP address is required", 400);

        await unblockIp(ip);
        return apiSuccess({ unblocked: true, ip });
    } catch (error) {
        return handleRouteError(error);
    }
}
