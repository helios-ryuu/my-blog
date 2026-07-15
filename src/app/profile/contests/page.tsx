import { requireAuth } from "@/lib/supabase/server";
import { MyContestsClient } from "./MyContestsClient";

export const metadata = {
    title: "My Contests | Toán Mô Hình Hà Nội",
};

export default async function MyContestsPage() {
    await requireAuth();
    return <MyContestsClient />;
}