import { NextRequest } from "next/server";
import { apiSuccess, handleRouteError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/supabase/server";
import { getAccentColor, updateAccentColor, getBannerConfig, updateBannerConfig } from "@/lib/site-settings";

export async function GET() {
    try {
        await requireAdmin();
        const [accentColor, bannerConfig] = await Promise.all([getAccentColor(), getBannerConfig()]);
        return apiSuccess({ accentColor, bannerConfig });
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await requireAdmin();
        const body = await request.json().catch(() => ({}));
        const [accentColor, bannerConfig] = await Promise.all([
            updateAccentColor(body.accentColor),
            body.bannerConfig != null ? updateBannerConfig(body.bannerConfig) : getBannerConfig(),
        ]);
        return apiSuccess({ accentColor, bannerConfig });
    } catch (error) {
        return handleRouteError(error);
    }
}
