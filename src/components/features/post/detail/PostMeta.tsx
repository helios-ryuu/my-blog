"use client";

type Level = "beginner" | "intermediate" | "advanced";

interface PostMetaProps {
    date?: string;
    readingTime?: string;
    level?: Level;
    size?: "sm" | "xs";
    className?: string;
}

export default function PostMeta({ date, readingTime, level, size = "sm", className = "" }: PostMetaProps) {
    if (!date && !readingTime && !level) return null;

    const sizeStyles = {
        xs: "text-xs",
        sm: "text-sm"
    };

    const levelStyles: Record<Level, string> = {
        beginner: "bg-green-500/20 text-green-500",
        intermediate: "bg-yellow-500/20 text-yellow-500",
        advanced: "bg-red-500/20 text-red-500"
    };

    const levelLabels: Record<Level, string> = {
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced"
    };

    return (
        <div className={`flex items-center gap-2 text-foreground/50 ${sizeStyles[size]} ${className}`}>
            {date && <span>{date}</span>}
            {date && (readingTime || level) && <span>•</span>}
            {readingTime && <span>{readingTime}</span>}
            {readingTime && level && <span>•</span>}
            {level && (
                <span className={`px-2 py-0.5 rounded-sm text-xs font-medium ${levelStyles[level]}`}>
                    {levelLabels[level]}
                </span>
            )}
        </div>
    );
}
