"use client";

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function IconButton({ children, onClick, className = "", ...props }: IconButtonProps) {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onClick?.(e);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
        e.stopPropagation();
    };

    return (
        <button
            type="button"
            {...props}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            className={`relative z-50 rounded-sm p-1 cursor-pointer hover:bg-background-hover [&>svg]:size-5 ${className}`}
        >
            {children}
        </button>
    );
}
