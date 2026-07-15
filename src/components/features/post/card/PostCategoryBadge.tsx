import type { PostCategory } from "@/types/database";

const LABEL: Record<PostCategory, string> = {
    news: "Tin tức",
    announcement: "Thông báo",
    tutorial: "Hướng dẫn",
    result: "Kết quả",
};

const STYLE: Record<PostCategory, string> = {
    news: "bg-blue-500/20 text-blue-500",
    announcement: "bg-yellow-500/20 text-yellow-500",
    tutorial: "bg-green-500/20 text-green-500",
    result: "bg-accent/20 text-accent",
};

export default function PostCategoryBadge({
    category,
    className = "",
}: {
    category: PostCategory;
    className?: string;
}) {
    return (
        <span
            className={`inline-block px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-[4px] ${STYLE[category]} ${className}`}
        >
            {LABEL[category]}
        </span>
    );
}

export const POST_CATEGORY_LABEL = LABEL;
