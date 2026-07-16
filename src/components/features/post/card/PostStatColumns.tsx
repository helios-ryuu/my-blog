"use client";

interface StatColumnsProps {
    stats: { label: string; value: React.ReactNode }[];
    className?: string;
}

export default function StatColumns({ stats, className = "" }: StatColumnsProps) {
    return (
        <div className={`flex flex-row items-stretch gap-1 ${className}`}>
            {stats.map((stat) => (
                <div key={stat.label} className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1 p-1.5">
                    <span className="text-xs font-semibold text-foreground/50 tracking-widest">{stat.label.toUpperCase()}</span>
                    <span className="whitespace-nowrap font-semibold text-[10px]">{stat.value}</span>
                </div>
            ))}
        </div>
    );
}
