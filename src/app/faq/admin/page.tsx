import { redirect } from "next/navigation";
import FAQPage from "@/components/features/faq/FAQPage";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata = {
    title: "Q&A Admin",
};

export default async function AdminFAQRoute() {
    const current = await getCurrentUser();
    if (current?.role !== "admin") redirect("/faq");
    return <FAQPage mode="admin" />;
}
