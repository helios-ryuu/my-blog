import { NextRequest } from "next/server";
import { apiSuccess, handleRouteError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/supabase/server";
import { getDocsConfig, updateDocsConfig } from "@/lib/site-settings";

export async function GET() {
    try {
        await requireAdmin();
        const docsConfig = await getDocsConfig();
        return apiSuccess(docsConfig);
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function PUT(request: NextRequest) {
    try {
        await requireAdmin();
        const body = await request.json().catch(() => null);
        const docsConfig = await updateDocsConfig(body);
        return apiSuccess(docsConfig);
    } catch (error) {
        return handleRouteError(error);
    }
}

