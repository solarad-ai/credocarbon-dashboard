"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { isSessionValid, clearSession } from "@/lib/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isValidating, setIsValidating] = useState(true);

    useEffect(() => {
        // Check if session is valid on mount
        if (!isSessionValid()) {
            clearSession();
            // Redirect to appropriate login page
            if (pathname.startsWith("/dashboard/buyer")) {
                router.push("/buyer/login");
            } else {
                router.push("/developer/login");
            }
        } else {
            setIsValidating(false);
        }
    }, [pathname, router]);

    // Show nothing while validating to prevent flash of dashboard content
    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Determine role from URL path
    const role = pathname.startsWith("/dashboard/buyer") ? "BUYER" : "DEVELOPER";

    // Wrap all dashboard content with SubscriptionProvider for feature gating
    const wrappedChildren = (
        <SubscriptionProvider>
            {children}
        </SubscriptionProvider>
    );

    // If buyer dashboard, don't wrap with DashboardLayout since buyer page has its own sidebar
    if (pathname.startsWith("/dashboard/buyer")) {
        return <>{wrappedChildren}</>;
    }

    return <DashboardLayout role={role}>{wrappedChildren}</DashboardLayout>;
}

