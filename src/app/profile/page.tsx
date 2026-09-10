import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getProfileReadme } from "@/lib/profile";
import ProfileView from "@/components/features/profile/ProfileView";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("nav");
    return {
        title: `${t("profile")} · Helios Space`,
        description: "Hồ sơ kỹ thuật và hành trình xây dựng hệ thống của Helios.",
    };
}

export default async function ProfilePage() {
    const markdown = await getProfileReadme();
    return <ProfileView markdown={markdown} />;
}

