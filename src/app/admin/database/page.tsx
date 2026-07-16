import { getTranslations } from "next-intl/server";
import DatabaseTab from "@/components/features/admin/tabs/DatabaseTab";
import { ToastProvider } from "@/components/ui/Toast";

export default async function DatabasePage() {
    const t = await getTranslations("admin");

    return (
        <ToastProvider>
            <div className="mx-auto w-full max-w-7xl px-4 py-8">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold tracking-widest text-accent">{t("databasePageTitle")}</h1>
                    <p className="mt-0.5 text-sm text-foreground/70">{t("databasePageSubtitle")}</p>
                </header>
                <DatabaseTab />
            </div>
        </ToastProvider>
    );
}
