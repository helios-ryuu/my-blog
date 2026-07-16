import { apiSuccess } from "@/lib/api-helpers";
import { getAccentColor } from "@/lib/site-settings";

export async function GET() {
    return apiSuccess({ accentColor: await getAccentColor() });
}
