import { Construction } from "lucide-react";

interface UnderDevelopmentProps {
    title?: string;
    description?: string;
    className?: string;
}

export default function UnderDevelopment({
    title = "Under development",
    description = "Tính năng này đang được phát triển. Vui lòng quay lại sau.",
    className = "",
}: UnderDevelopmentProps) {
    return (
        <div className={`flex flex-col items-center justify-center text-center px-4 py-16 gap-3 ${className}`}>
            <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-500">
                <Construction size={28} />
            </div>
            <h2 className="text-xl font-semibold text-foreground tracking-wide">{title}</h2>
            <p className="text-sm text-foreground/60 max-w-md">{description}</p>
        </div>
    );
}
