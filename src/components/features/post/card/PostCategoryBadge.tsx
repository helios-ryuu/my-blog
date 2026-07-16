import type { PostCategory } from "@/types/database";

export default function PostCategoryBadge({
    category,
    name,
    icon,
    className = "",
}: {
    category: PostCategory;
    name?: string;
    icon?: string | null;
    className?: string;
}) {
    const label = name ?? category.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-[4px] border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent ${className}`}
        >
            {icon && <span aria-hidden="true" className="text-xs leading-none">{icon}</span>}
            {label}
        </span>
    );
}
