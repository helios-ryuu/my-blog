import { NextRequest } from "next/server";
import { apiSuccess, handleRouteError, HttpError, revalidateCategories } from "@/lib/api-helpers";
import { createCategory, getCategoryByName, getCategoryBySlug, listCategoriesWithPostCounts } from "@/lib/categories-db";
import { parseCategoryCreateInput } from "@/lib/content-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/server";

export async function GET() {
    try {
        await requireAdmin();
        return apiSuccess(await listCategoriesWithPostCounts(createSupabaseAdminClient()));
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const input = parseCategoryCreateInput(await request.json().catch(() => null));
        const supabase = createSupabaseAdminClient();
        if (await getCategoryBySlug(supabase, input.slug)) throw new HttpError(409, "Category slug already exists");
        if (await getCategoryByName(supabase, input.name)) throw new HttpError(409, "Category name already exists");
        const category = await createCategory(supabase, input);
        revalidateCategories();
        return apiSuccess(category);
    } catch (error) {
        return handleRouteError(error);
    }
}
