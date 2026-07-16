import { unstable_cache } from "next/cache";
import { apiSuccess, handleRouteError } from "@/lib/api-helpers";
import { listCategories } from "@/lib/categories-db";
import { createSupabasePublicClient } from "@/lib/supabase/public";

const getCachedCategories = unstable_cache(
    async () => listCategories(createSupabasePublicClient()),
    ["public-categories"],
    { revalidate: 300, tags: ["categories"] },
);

export async function GET() {
    try {
        return apiSuccess(await getCachedCategories());
    } catch (error) {
        return handleRouteError(error);
    }
}
