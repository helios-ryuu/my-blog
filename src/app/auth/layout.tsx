import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("auth");
    return { title: t("title"), description: t("description") };
}

export default function AuthLayout({ children }: { children: ReactNode }) {
    return children;
}
