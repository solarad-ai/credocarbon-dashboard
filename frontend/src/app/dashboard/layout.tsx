"use client";

import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

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

