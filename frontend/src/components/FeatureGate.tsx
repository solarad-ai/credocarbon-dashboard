"use client";

import React from "react";
import { useSubscription, TIER_NAMES } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Lock, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";

interface FeatureGateProps {
    /** The feature key to check access for */
    feature: string;
    /** Optional custom fallback content when access is denied */
    fallback?: React.ReactNode;
    /** Whether to show a minimal fallback (just lock icon) */
    minimal?: boolean;
    /** Children to render if access is granted */
    children: React.ReactNode;
}

/**
 * FeatureGate component that conditionally renders children based on subscription tier.
 * 
 * Usage:
 * ```tsx
 * <FeatureGate feature="dev.pdd_structuring">
 *   <PDDGeneratorButton />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({ feature, fallback, minimal = false, children }: FeatureGateProps) {
    const { hasFeature, isLoading, subscription } = useSubscription();

    // Show nothing while loading
    if (isLoading) {
        return null;
    }

    // User has access
    if (hasFeature(feature)) {
        return <>{children}</>;
    }

    // Custom fallback provided
    if (fallback) {
        return <>{fallback}</>;
    }

    // Minimal fallback
    if (minimal) {
        return (
            <div className="inline-flex items-center gap-1 text-slate-400">
                <Lock className="h-4 w-4" />
            </div>
        );
    }

    // Default upgrade CTA
    return <UpgradeCTA feature={feature} currentTier={subscription?.tier} />;
}

interface UpgradeCTAProps {
    feature: string;
    currentTier?: string;
}

/**
 * Upgrade call-to-action component shown when a feature is locked
 */
export function UpgradeCTA({ feature, currentTier }: UpgradeCTAProps) {
    const tierName = currentTier ? TIER_NAMES[currentTier as keyof typeof TIER_NAMES] : "Free";

    // Extract feature category from feature key (e.g., "dev.pdd_structuring" -> "Developer")
    const getRequiredPackage = (featureKey: string): string => {
        const prefix = featureKey.split(".")[0];
        const packageMap: Record<string, string> = {
            analysis: "Free Analysis (PKG_0)",
            buyer: "Buyer Sourcing (PKG_1)",
            dev: "Developer Registration (PKG_2)",
            mrv: "Developer MRV (PKG_3)",
            rec: "RECs (PKG_4)",
            compliance: "Compliance (PKG_5)",
        };
        return packageMap[prefix] || "an upgraded package";
    };

    return (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4 text-center">
            <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800/50 rounded-full flex items-center justify-center">
                    <Lock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                Feature Locked
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                This feature requires {getRequiredPackage(feature)}.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">
                Your current tier: <span className="font-medium">{tierName}</span>
            </p>
            <Link href="/contact">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Crown className="h-4 w-4 mr-1" />
                    Upgrade Plan
                    <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
            </Link>
        </div>
    );
}

/**
 * HOC to wrap a component with feature gating
 */
export function withFeatureGate<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    feature: string,
    FallbackComponent?: React.ComponentType
) {
    return function FeatureGatedComponent(props: P) {
        return (
            <FeatureGate feature={feature} fallback={FallbackComponent ? <FallbackComponent /> : undefined}>
                <WrappedComponent {...props} />
            </FeatureGate>
        );
    };
}
