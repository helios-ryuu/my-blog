import { getTranslations } from "next-intl/server";
import DatabaseTab from "@/components/features/admin/tabs/DatabaseTab";
import { ToastProvider } from "@/components/ui/Toast";

export default async function DatabasePage() {
    const t = await getTranslations("admin");

    return (
        <ToastProvider>
            <div className="mx-auto w-full max-w-7xl px-4 py-8">
                <DatabaseTab />
            </div>
        </ToastProvider>
    );
}
