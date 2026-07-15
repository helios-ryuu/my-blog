import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
    title: ReactNode;
    description?: ReactNode;
    eyebrow?: ReactNode;
    actions?: ReactNode;
    align?: "left" | "center";
    className?: string;
    titleClassName?: string;
    descriptionClassName?: string;
};

export default function PageHeader({
    title,
    description,
    eyebrow,
    actions,
    align = "left",
    className,
    titleClassName,
    descriptionClassName,
}: PageHeaderProps) {
    const isCentered = align === "center";

    return (
        <header
            className={cn(
                "mb-6 flex flex-col gap-3",
                isCentered ? "items-center text-center" : "items-start text-left",
                className,
            )}
        >
            {eyebrow && (
                <div className="text-xs font-semibold uppercase tracking-widest text-foreground/62">
                    {eyebrow}
                </div>
            )}
            <div className={cn("flex w-full flex-col gap-2", isCentered ? "items-center" : "items-start")}>
                <h1
                    className={cn(
                        "text-2xl font-bold uppercase tracking-widest text-accent md:text-3xl",
                        titleClassName,
                    )}
                >
                    {title}
                </h1>
                {description && (
                    <p
                        className={cn(
                            "max-w-3xl text-sm leading-relaxed text-foreground/74 md:text-base",
                            descriptionClassName,
                        )}
                    >
                        {description}
                    </p>
                )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}
