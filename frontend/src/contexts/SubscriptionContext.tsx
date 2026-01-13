"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Types
export type SubscriptionTier =
    | "PKG_0"
    | "PKG_1"
    | "PKG_2"
    | "PKG_3"
    | "PKG_4"
    | "PKG_5"
    | "PKG_6"
    | "PKG_FULL";

export interface TierFeature {
    feature_key: string;
    feature_name: string;
    feature_description?: string;
    is_included: boolean;
    limits: Record<string, any>;
}

export interface Subscription {
    id: number;
    user_id: number;
    tier: SubscriptionTier;
    tier_name: string;
    custom_limits: Record<string, any>;
    addons: string[];
    valid_until: string | null;
}

interface SubscriptionContextType {
    subscription: Subscription | null;
    features: TierFeature[];
    isLoading: boolean;
    error: string | null;
    hasFeature: (featureKey: string) => boolean;
    getFeatureLimits: (featureKey: string) => Record<string, any> | null;
    isFullAccess: () => boolean;
    refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Tier names for display
export const TIER_NAMES: Record<SubscriptionTier, string> = {
    PKG_0: "Free Analysis",
    PKG_1: "Buyer: Sourcing & Execution",
    PKG_2: "Developer: Project Registration",
    PKG_3: "Developer: MRV & Issuance",
    PKG_4: "Renewable Energy Certificates",
    PKG_5: "Compliance & ETS Support",
    PKG_6: "Optional Add-ons",
    PKG_FULL: "Full Access",
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://credocarbon-api-641001192587.asia-south2.run.app/api';

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [features, setFeatures] = useState<TierFeature[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscription = useCallback(async () => {
        // Get token - try both regular and superadmin tokens
        const token = localStorage.getItem("token") || localStorage.getItem("superadmin_token");

        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            // Fetch subscription
            const subResponse = await fetch(`${API_BASE_URL}/subscription/me`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!subResponse.ok) {
                if (subResponse.status === 401) {
                    // Not authenticated, that's okay
                    setIsLoading(false);
                    return;
                }
                throw new Error("Failed to fetch subscription");
            }

            const subData = await subResponse.json();
            setSubscription(subData);

            // Fetch features for this tier
            const featuresResponse = await fetch(`${API_BASE_URL}/subscription/features`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (featuresResponse.ok) {
                const featuresData = await featuresResponse.json();
                setFeatures(featuresData);
            }

            setError(null);
        } catch (err) {
            console.error("Failed to fetch subscription:", err);
            setError(err instanceof Error ? err.message : "Failed to load subscription");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    const hasFeature = useCallback((featureKey: string): boolean => {
        // Full access gets everything
        if (subscription?.tier === "PKG_FULL") {
            return true;
        }

        // Check if feature is in the features list
        const feature = features.find(f => f.feature_key === featureKey);
        if (feature && feature.is_included) {
            return true;
        }

        // Check if it's in addons
        if (subscription?.addons?.includes(featureKey)) {
            return true;
        }

        return false;
    }, [subscription, features]);

    const getFeatureLimits = useCallback((featureKey: string): Record<string, any> | null => {
        // Check custom limits first
        if (subscription?.custom_limits?.[featureKey]) {
            return subscription.custom_limits[featureKey];
        }

        // Check feature limits
        const feature = features.find(f => f.feature_key === featureKey);
        if (feature) {
            return feature.limits;
        }

        return null;
    }, [subscription, features]);

    const isFullAccess = useCallback((): boolean => {
        return subscription?.tier === "PKG_FULL";
    }, [subscription]);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        await fetchSubscription();
    }, [fetchSubscription]);

    const value: SubscriptionContextType = {
        subscription,
        features,
        isLoading,
        error,
        hasFeature,
        getFeatureLimits,
        isFullAccess,
        refresh,
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription(): SubscriptionContextType {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error("useSubscription must be used within a SubscriptionProvider");
    }
    return context;
}

// Hook for checking specific feature
export function useFeature(featureKey: string): { hasAccess: boolean; isLoading: boolean; limits: Record<string, any> | null } {
    const { hasFeature, getFeatureLimits, isLoading } = useSubscription();

    return {
        hasAccess: hasFeature(featureKey),
        isLoading,
        limits: getFeatureLimits(featureKey),
    };
}
