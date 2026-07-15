"use client";

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: "primary" | "secondary";
}

export default function Button({
    children,
    onClick,
    className = "",
    variant = "secondary"
}: ButtonProps) {
    const variants = {
        primary: "border-accent bg-accent/90 hover:border-accent-hover hover:bg-accent-hover",
        secondary: "border-accent/70 bg-accent/30 hover:border-accent-hover/80 hover:bg-accent-hover/60"
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-[7px] border px-3 py-0.5 text-[12px] cursor-pointer ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}
