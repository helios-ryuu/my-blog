"use client";

interface StatColumnsProps {
    stats: { label: string; value: React.ReactNode }[];
    className?: string;
}

export default function StatColumns({ stats, className = "" }: StatColumnsProps) {
    return (
        <div className={`flex flex-row items-stretch gap-2 ${className}`}>
            {stats.map((stat) => (
                <div key={stat.label} className="flex-1 flex flex-col items-start justify-center gap-1 p-2">
                    <span className="text-xs font-semibold text-foreground/50 tracking-widest">{stat.label.toUpperCase()}</span>
                    <span className="font-semibold text-[10px]">{stat.value}</span>
                </div>
            ))}
        </div>
    );
}
