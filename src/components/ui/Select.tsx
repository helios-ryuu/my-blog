"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { forwardRef } from "react";

const EMPTY_VALUE = "__all__";

interface SelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    className?: string;
    isActive?: boolean;
}

const Select = forwardRef<HTMLButtonElement, SelectProps>(
    ({ value, onValueChange, options, placeholder = "Select...", className = "", isActive = false }, ref) => {
        // Convert empty string to special value for Radix
        const internalValue = value === "" ? EMPTY_VALUE : value;

        const handleValueChange = (newValue: string) => {
            // Convert special value back to empty string
            onValueChange(newValue === EMPTY_VALUE ? "" : newValue);
        };

        // Convert options with empty value to special value
        const internalOptions = options.map((opt) => ({
            ...opt,
            value: opt.value === "" ? EMPTY_VALUE : opt.value,
        }));

        return (
            <SelectPrimitive.Root value={internalValue} onValueChange={handleValueChange}>
                <SelectPrimitive.Trigger
                    ref={ref}
                    className={`flex items-center justify-between gap-2 px-2 py-1 border border-(--border-color) rounded-sm text-sm focus:outline-none focus:border-accent data-placeholder:text-(--foreground-dim) ${isActive ? "bg-accent/15 text-accent border-accent/50" : "bg-background-hover text-foreground"} ${className}`}
                >
                    <SelectPrimitive.Value placeholder={placeholder} />
                    <SelectPrimitive.Icon>
                        <ChevronDown className={`w-4 h-4 text-(--foreground-dim) ${isActive ? "text-accent" : ""}`} />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>

                <SelectPrimitive.Portal>
                    <SelectPrimitive.Content
                        className="overflow-hidden bg-background border border-(--border-color) rounded-[10px] shadow-lg z-50 min-w-(--radix-select-trigger-width)"
                        position="popper"
                        sideOffset={4}
                    >
                        <SelectPrimitive.Viewport className="p-1">
                            {internalOptions.map((option) => (
                                <SelectPrimitive.Item
                                    key={option.value}
                                    value={option.value}
                                    className="relative flex items-center px-6 py-1.5 text-sm text-foreground rounded-md cursor-pointer select-none hover:bg-background-hover focus:bg-background-hover focus:outline-none data-highlighted:bg-background-hover"
                                >
                                    <SelectPrimitive.ItemIndicator className="absolute left-1 w-4 h-4 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-accent" />
                                    </SelectPrimitive.ItemIndicator>
                                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                                </SelectPrimitive.Item>
                            ))}
                        </SelectPrimitive.Viewport>
                    </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
        );
    }
);

Select.displayName = "Select";

export default Select;
