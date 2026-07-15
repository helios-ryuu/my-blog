"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Check } from "lucide-react";

interface MultiSelectProps {
    values: string[];
    onValuesChange: (values: string[]) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    className?: string;
    isActive?: boolean;
}

export default function MultiSelect({
    values,
    onValuesChange,
    options,
    placeholder = "Select...",
    className = "",
    isActive = false,
}: MultiSelectProps) {
    const handleToggle = (value: string) => {
        if (values.includes(value)) {
            onValuesChange(values.filter((v) => v !== value));
        } else {
            onValuesChange([...values, value]);
        }
    };

    const displayText = values.length === 0
        ? placeholder
        : values.length === 1
            ? options.find((o) => o.value === values[0])?.label || values[0]
            : `${values.length} selected`;

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className={`flex items-center justify-between gap-2 px-2 py-1 border border-(--border-color) rounded-sm text-sm focus:outline-none focus:border-accent ${isActive ? "bg-accent/15 text-accent border-accent/50" : "bg-background-hover text-foreground"} ${className}`}
                >
                    <span className="truncate">{displayText}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 ${isActive ? "text-accent" : "text-(--foreground-dim)"}`} />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="bg-background border border-(--border-color) rounded-[10px] shadow-lg z-50 p-1 min-w-(--radix-dropdown-menu-trigger-width) max-h-80 overflow-y-auto"
                    sideOffset={4}
                    align="start"
                >
                    {options.map((option) => (
                        <DropdownMenu.CheckboxItem
                            key={option.value}
                            checked={values.includes(option.value)}
                            onCheckedChange={() => handleToggle(option.value)}
                            onSelect={(e) => e.preventDefault()}
                            className="relative flex items-center px-6 py-1.5 text-sm text-foreground rounded-md cursor-pointer select-none hover:bg-background-hover focus:bg-background-hover focus:outline-none data-highlighted:bg-background-hover"
                        >
                            <DropdownMenu.ItemIndicator className="absolute left-1 w-4 h-4 flex items-center justify-center">
                                <Check className="w-3 h-3 text-accent" />
                            </DropdownMenu.ItemIndicator>
                            {option.label}
                        </DropdownMenu.CheckboxItem>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
