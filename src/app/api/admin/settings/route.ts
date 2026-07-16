import { NextRequest } from "next/server";
import { apiSuccess, handleRouteError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/supabase/server";
import { getAccentColor, updateAccentColor } from "@/lib/site-settings";

export async function GET() {
    try {
        await requireAdmin();
        return apiSuccess({ accentColor: await getAccentColor() });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await requireAdmin();
        const body = await request.json().catch(() => ({}));
        return apiSuccess({ accentColor: await updateAccentColor(body.accentColor) });
    } catch (error) {
        return handleRouteError(error);
    }
}
