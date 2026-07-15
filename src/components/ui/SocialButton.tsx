"use client";

import Image from "next/image";

interface SocialButtonProps {
    lightIcon: string;
    darkIcon: string;
    alt: string;
    appUrl: string;
    webUrl: string;
    theme: "light" | "dark";
    className?: string;
}

export default function SocialButton({
    lightIcon,
    darkIcon,
    alt,
    appUrl,
    webUrl,
    theme,
    className = ""
}: SocialButtonProps) {
    const handleClick = () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            window.location.href = appUrl;
            setTimeout(() => window.open(webUrl, "_blank"), 500);
        } else {
            window.open(webUrl, "_blank");
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`flex-none w-8 h-8 inline-flex items-center justify-center mx-0.5 rounded-md cursor-pointer hover:bg-background-hover ${className}`}
        >
            <Image
                src={theme === "light" ? lightIcon : darkIcon}
                alt={alt}
                width={20}
                height={20}
                className="w-4 h-4"
            />
        </button>
    );
}
