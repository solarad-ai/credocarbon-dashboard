"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
    /** Show full logo with text, or just icon */
    variant?: "full" | "icon";
    /** Size preset */
    size?: "sm" | "md" | "lg" | "xl";
    /** Optional additional className */
    className?: string;
    /** Show tagline under logo */
    showTagline?: boolean;
}

const sizeMap = {
    sm: { icon: 32, full: 120 },
    md: { icon: 40, full: 160 },
    lg: { icon: 48, full: 200 },
    xl: { icon: 64, full: 280 },
};

/**
 * CredoCarbon Logo Component
 * Uses the official logo image from /public/logo.png
 */
export function Logo({
    variant = "full",
    size = "md",
    className,
    showTagline = false
}: LogoProps) {
    const dimensions = sizeMap[size];

    if (variant === "icon") {
        // Just the leaf icon in rounded square
        return (
            <div
                className={cn(
                    "rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg",
                    className
                )}
                style={{
                    width: dimensions.icon,
                    height: dimensions.icon
                }}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-slate-900"
                    style={{
                        width: dimensions.icon * 0.55,
                        height: dimensions.icon * 0.55
                    }}
                >
                    <path
                        d="M12 21C12 21 5 15.5 5 10C5 6.5 7.5 3 12 3C16.5 3 19 6.5 19 10C19 15.5 12 21 12 21Z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M12 21C12 21 12 15.5 12 10M12 10C9 11.5 7 13 7 13M12 10C15 11.5 17 13 17 13"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        );
    }

    // Full logo with text
    return (
        <div className={cn("flex flex-col", className)}>
            <Image
                src="/logo.png"
                alt="CredoCarbon"
                width={dimensions.full}
                height={dimensions.full * 0.4}
                className="object-contain"
                priority
            />
            {showTagline && (
                <span className="text-emerald-400 text-xs mt-1 tracking-wide">
                    Unified MRV · Registry · Trading
                </span>
            )}
        </div>
    );
}

/**
 * Simple icon-only version for sidebars
 * Uses the actual leaf SVG matching the logo style
 */
export function LogoIcon({
    size = 40,
    className
}: {
    size?: number;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg ring-4 ring-emerald-500/20",
                className
            )}
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 40 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-900"
                style={{ width: size * 0.6, height: size * 0.6 }}
            >
                {/* Leaf shape matching the CredoCarbon logo */}
                <path
                    d="M20 35C20 35 8 26 8 16C8 9 12 4 20 4C28 4 32 9 32 16C32 26 20 35 20 35Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M20 35V16M20 16C14 19 10 22 10 22M20 16C26 19 30 22 30 22"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
}

export default Logo;
