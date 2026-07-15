"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Column {
    key: string;
    label: string;
    render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface DataTableProps {
    title: string;
    columns: Column[];
    data: Record<string, unknown>[];
    isLoading?: boolean;
}

export default function DataTable({ title, columns, data, isLoading }: DataTableProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDirection("asc");
        }
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortKey) return 0;
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (typeof aVal === "string" && typeof bVal === "string") {
            return sortDirection === "asc"
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
            return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        return 0;
    });

    return (
        <div className="border border-(--border-color) rounded-lg overflow-hidden bg-(--post-card)">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-foreground/5 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    <span className="text-sm text-foreground/50">({data.length} records)</span>
                </div>
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {isExpanded && (
                <div className="border-t border-(--border-color)">
                    {isLoading ? (
                        <div className="p-8 text-center text-foreground/50">Loading...</div>
                    ) : data.length === 0 ? (
                        <div className="p-8 text-center text-foreground/50">No data</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-foreground/5">
                                    <tr>
                                        {columns.map((col) => (
                                            <th
                                                key={col.key}
                                                onClick={() => handleSort(col.key)}
                                                className="px-3 py-2 text-left font-medium text-foreground/70 cursor-pointer hover:text-foreground whitespace-nowrap"
                                            >
                                                <div className="flex items-center gap-1">
                                                    {col.label}
                                                    {sortKey === col.key && (
                                                        <span className="text-accent">
                                                            {sortDirection === "asc" ? "↑" : "↓"}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--border-color)">
                                    {sortedData.map((row, rowIndex) => (
                                        <tr key={rowIndex} className="hover:bg-foreground/5">
                                            {columns.map((col) => (
                                                <td key={col.key} className="px-3 py-2 text-foreground/80">
                                                    {col.render
                                                        ? col.render(row[col.key], row)
                                                        : formatValue(row[col.key])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function formatValue(value: unknown): React.ReactNode {
    if (value === null || value === undefined) {
        return <span className="text-foreground/30">null</span>;
    }
    if (typeof value === "boolean") {
        return (
            <span className={value ? "text-green-500" : "text-red-500"}>
                {value ? "true" : "false"}
            </span>
        );
    }
    if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        return new Date(value).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    if (typeof value === "string" && value.length > 50) {
        return <span title={value}>{value.substring(0, 50)}...</span>;
    }
    return String(value);
}
