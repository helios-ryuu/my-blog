"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import ProfileReadme from "@/components/features/profile/ProfileReadme";
import ProfileCard from "@/components/ui/ProfileCard";

const GradientWaves = dynamic(() => import("@/components/ui/GradientWaves"), { ssr: false });

interface ProfileViewProps {
    markdown: string;
}

export default function ProfileView({ markdown }: ProfileViewProps) {
    const t = useTranslations("profile");

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden">
            {/* 3D GradientWaves Interactive Canvas Background */}
            <div className="pointer-events-none fixed inset-0 -z-10 h-full w-full overflow-hidden">
                <GradientWaves
                    horizonColor="#180d2e"
                    waveColor="#6d28d9"
                    crestColor="#f59e0b"
                    speed={0.35}
                    amplitude={2.2}
                    waveScale={0.55}
                    waveRatio={0.85}
                    swell={28}
                    turbulence={18}
                    tilt={1.12}
                    zoom={1.0}
                    height={5.0}
                    fogDepth={18}
                    detail="medium"
                    brightness={1.1}
                    opacity={0.85}
                    mouseInteraction={true}
                    parallaxStrength={0.4}
                    grain={true}
                    grainIntensity={0.03}
                />
            </div>

            {/* Foreground Content */}
            <div className="relative z-10 mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-10 lg:px-8 xl:px-10">
                <div className="grid grid-cols-1 items-start gap-8 xl:gap-10 lg:grid-cols-12">
                    {/* Left Column: Interactive 3D Tilt Profile Card */}
                    <div className="flex flex-col items-center justify-center lg:col-span-5 xl:col-span-4 lg:sticky lg:top-16">
                        <ProfileCard
                            name="Helios"
                            title="DevOps Engineer"
                            handle="helios-ryuu"
                            status={t("status")}
                            contactText={t("contact")}
                            avatarUrl="/assets/profile/avatar.png"
                            miniAvatarUrl="/assets/profile/avatar-full.jpg"
                            showUserInfo={true}
                            enableTilt={true}
                            enableMobileTilt={false}
                            onContactClick={() => window.open("https://github.com/helios-ryuu", "_blank")}
                            behindGlowEnabled={true}
                            innerGradient="linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)"
                        />
                    </div>

                    {/* Right Column: GitHub Profile README */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        <ProfileReadme markdown={markdown} />
                    </div>
                </div>
            </div>
        </div>
    );
}

