"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PageLoadingShell() {
    const t = useTranslations("common");

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col items-center justify-center gap-3 text-foreground/60">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-sm tracking-wide">{t("loading")}</p>
        </div>
    );
}
