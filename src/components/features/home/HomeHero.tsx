"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks";
import Shuffle from "@/components/ui/Shuffle";
import SplitText from "@/components/ui/SplitText";
import BorderGlow from "@/components/ui/BorderGlow";

interface HomeHeroProps {
    heroLead: string;
    explorePostsText: string;
    aboutAuthorText: string;
}

export default function HomeHero({
    heroLead,
    explorePostsText,
    aboutAuthorText,
}: HomeHeroProps) {
    const { resolvedTheme } = useTheme();
    const mounted = useMounted();
    const isLight = mounted && resolvedTheme === "light";
    const btnBg = isLight ? "#ffffff" : "#09090b";

    const scrollToPosts = () => {
        const target = document.getElementById("recent-posts");
        if (target) {
            target.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <section className="relative flex min-h-[85vh] sm:min-h-[88vh] flex-col items-center justify-center text-center px-4 pt-12 pb-16 sm:pb-20 sm:pt-16">
            <div className="flex w-full max-w-5xl flex-col items-center">
                {/* Title: prominent badge/eyebrow */}
                <div className="mb-5 sm:mb-7">
                    <Shuffle
                        text="Helios Space"
                        tag="h2"
                        shuffleDirection="right"
                        duration={0.35}
                        shuffleTimes={2}
                        className="text-sm sm:text-base md:text-xl font-bold uppercase tracking-[0.28em] text-accent drop-shadow-xs"
                    />
                </div>

                {/* Description: in the center, bigger size and bolder */}
                <div className="w-full max-w-4xl sm:max-w-5xl px-2 sm:px-4">
                    <SplitText
                        text={heroLead}
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[3.85rem] leading-tight sm:leading-[1.35] font-semibold tracking-tight text-foreground text-center"
                        delay={35}
                        duration={0.7}
                        ease="power3.out"
                        splitType="chars"
                        from={{ opacity: 0, y: 35 }}
                        to={{ opacity: 1, y: 0 }}
                        threshold={0.1}
                        rootMargin="-100px"
                        textAlign="center"
                        tag="p"
                    />
                </div>

                {/* CTA Buttons */}
                <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-3.5">
                    <BorderGlow
                        backgroundColor={btnBg}
                        borderRadius={8}
                        glowRadius={25}
                        edgeSensitivity={30}
                        glowIntensity={1.2}
                        className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Link
                            href="/post"
                            className="inline-flex h-11 items-center justify-center gap-2 px-6 text-sm font-semibold text-foreground transition-colors hover:text-accent"
                        >
                            {explorePostsText}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </BorderGlow>
                    <BorderGlow
                        backgroundColor={btnBg}
                        borderRadius={8}
                        glowRadius={25}
                        edgeSensitivity={30}
                        glowIntensity={1.2}
                        className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Link
                            href="/about"
                            className="inline-flex h-11 items-center justify-center px-6 text-sm font-semibold text-foreground transition-colors hover:text-accent"
                        >
                            {aboutAuthorText}
                        </Link>
                    </BorderGlow>
                </div>
            </div>

            {/* Scroll Indicator */}
            <button
                type="button"
                onClick={scrollToPosts}
                aria-label="Scroll to recent posts"
                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-xs text-foreground/50 hover:text-accent transition-colors cursor-pointer"
            >
                <span className="text-[11px] uppercase tracking-wider font-mono">Scroll</span>
                <ChevronDown className="h-4 w-4 animate-bounce text-accent" />
            </button>
        </section>
    );
}
