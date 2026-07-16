import { NextRequest, NextResponse } from "next/server";
import {
    apiError,
    apiSuccess,
    handleRouteError,
    HttpError,
    parseIdParam,
    revalidateCategories,
} from "@/lib/api-helpers";
import {
    countCategoryPosts,
    deleteCategory,
    getCategoryById,
    getCategoryByName,
    getCategoryBySlug,
    updateCategory,
} from "@/lib/categories-db";
import { parseCategoryPatchInput } from "@/lib/content-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(context.params, "category id");
        if (id instanceof NextResponse) return id;
        const input = parseCategoryPatchInput(await request.json().catch(() => null));
        const supabase = createSupabaseAdminClient();
        const current = await getCategoryById(supabase, id);
        if (!current) return apiError("Category not found", 404);
        if (input.slug && input.slug !== current.slug && await getCategoryBySlug(supabase, input.slug)) {
            throw new HttpError(409, "Category slug already exists");
        }
        if (input.name && input.name !== current.name && await getCategoryByName(supabase, input.name)) {
            throw new HttpError(409, "Category name already exists");
        }
        const category = await updateCategory(supabase, id, input);
        revalidateCategories();
        return apiSuccess(category);
    } catch (error) {
        return handleRouteError(error);
    }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await requireAdmin();
        const id = await parseIdParam(context.params, "category id");
        if (id instanceof NextResponse) return id;
        const supabase = createSupabaseAdminClient();
        const category = await getCategoryById(supabase, id);
        if (!category) return apiError("Category not found", 404);
        const postCount = await countCategoryPosts(supabase, category.slug);
        if (postCount > 0) throw new HttpError(409, `Category is used by ${postCount} post(s)`);
        await deleteCategory(supabase, id);
        revalidateCategories();
        return apiSuccess({ id });
    } catch (error) {
        return handleRouteError(error);
    }
}
