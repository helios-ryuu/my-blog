"use client";

interface IconButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export default function IconButton({ children, onClick, className = "" }: IconButtonProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.();
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        e.stopPropagation();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            className={`relative z-50 rounded-sm p-1 cursor-pointer hover:bg-background-hover [&>svg]:size-5 ${className}`}
        >
            {children}
        </button>
    );
}
