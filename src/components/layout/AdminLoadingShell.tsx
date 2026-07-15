"use client";

import { Loader2 } from "lucide-react";

interface AdminLoadingShellProps {
    label?: string;
}

export default function AdminLoadingShell({ label = "Loading…" }: AdminLoadingShellProps) {
    return (
        <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col items-center justify-center gap-3 text-foreground/60">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-sm tracking-wide">{label}</p>
        </div>
    );
}
