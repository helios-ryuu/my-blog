import { getTranslations } from "next-intl/server";
import BucketManager from "@/components/features/admin/tabs/BucketManager";
import { ToastProvider } from "@/components/ui/Toast";

export default async function BucketPage() {
    const t = await getTranslations("admin");

    return (
        <ToastProvider>
            <div className="h-full flex flex-col">
                <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 px-4">
                    <header className="py-8 mb-6">
                        <h1 className="text-2xl font-bold tracking-widest text-accent">{t("bucketPageTitle")}</h1>
                        <p className="text-sm text-foreground/70 mt-0.5">
                            {t("bucketPageSubtitle")}
                        </p>
                    </header>
                    <div className="flex-1 overflow-hidden">
                        <BucketManager initialBucket="post-images" allowBucketSwitch mode="manage" />
                    </div>
                </div>
            </div>
        </ToastProvider>
    );
}
