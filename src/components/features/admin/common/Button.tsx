"use client";

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
    | "primary"      // accent filled - main action
    | "publish"      // green filled
    | "unpublish"    // yellow filled  
    | "danger"       // red filled
    | "cancel"       // gray border, gray/20 bg
    | "save"         // accent border, accent/20 bg
    | "attention"    // red border, red/20 bg (logout, etc)
    | "utility"      // blue border, blue/20 bg (refresh, etc)
    | "info";        // blue filled

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: ReactNode;
    iconPosition?: "left" | "right";
    isLoading?: boolean;
    loadingText?: string;
    fullWidth?: boolean;
    children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-accent text-white hover:bg-accent/90",
    publish: "bg-green-600 text-white hover:bg-green-700",
    unpublish: "bg-yellow-600 text-white hover:bg-yellow-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    cancel: "border border-(--border-color) text-foreground/70 bg-foreground/5 hover:bg-foreground/10",
    save: "border border-accent text-accent bg-accent/20 hover:bg-accent/30",
    attention: "border border-yellow-500 text-yellow-500 bg-yellow-500/20 hover:bg-yellow-500/30",
    utility: "border border-blue-500 text-blue-500 bg-blue-500/20 hover:bg-blue-500/30",
    info: "bg-blue-600 text-white hover:bg-blue-700",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2",
};

const iconSizes: Record<ButtonSize, number> = {
    sm: 14,
    md: 16,
    lg: 18,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            icon,
            iconPosition = "left",
            isLoading = false,
            loadingText,
            fullWidth = false,
            children,
            className = "",
            disabled,
            ...props
        },
        ref
    ) => {
        const iconSize = iconSizes[size];
        const isDisabled = disabled || isLoading;

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={`
                    inline-flex items-center justify-center font-medium rounded-md
                    transition-colors cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${variantStyles[variant]}
                    ${sizeStyles[size]}
                    ${fullWidth ? "w-full" : ""}
                    ${className}
                `}
                {...props}
            >
                {isLoading ? (
                    <>
                        <Loader2 size={iconSize} className="animate-spin" />
                        {loadingText || children}
                    </>
                ) : (
                    <>
                        {icon && iconPosition === "left" && (
                            <span className="shrink-0">{icon}</span>
                        )}
                        {children}
                        {icon && iconPosition === "right" && (
                            <span className="shrink-0">{icon}</span>
                        )}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = "Button";

// Convenient preset components
export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
    (props, ref) => <Button ref={ref} variant="primary" {...props} />
);
PrimaryButton.displayName = "PrimaryButton";

export const PublishButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
    (props, ref) => <Button ref={ref} variant="publish" {...props} />
);
PublishButton.displayName = "PublishButton";

export const UnpublishButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
    (props, ref) => <Button ref={ref} variant="unpublish" {...props} />
);
UnpublishButton.displayName = "UnpublishButton";

export const DangerButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
    (props, ref) => <Button ref={ref} variant="danger" {...props} />
);
DangerButton.displayName = "DangerButton";

export const CancelButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
    (props, ref) => <Button ref={ref} variant="cancel" {...props} />
);
CancelButton.displayName = "CancelButton";

export const SaveButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
    (props, ref) => <Button ref={ref} variant="save" {...props} />
);
SaveButton.displayName = "SaveButton";

export const AttentionButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
    (props, ref) => <Button ref={ref} variant="attention" {...props} />
);
AttentionButton.displayName = "AttentionButton";

export const UtilityButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
    (props, ref) => <Button ref={ref} variant="utility" {...props} />
);
UtilityButton.displayName = "UtilityButton";
