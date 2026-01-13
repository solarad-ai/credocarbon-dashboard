"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, CreditCard, Activity } from "lucide-react";
import { adminApi } from "@/lib/api";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminApi.getStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            title: "Total Users",
            value: stats?.total_users || 0,
            subValue: `${stats?.active_users || 0} active`,
            icon: Users,
            gradient: "from-blue-500 to-indigo-600",
        },
        {
            title: "Total Projects",
            value: stats?.total_projects || 0,
            subValue: "All statuses",
            icon: FolderKanban,
            gradient: "from-emerald-500 to-green-600",
        },
        {
            title: "Transactions",
            value: stats?.total_transactions || 0,
            subValue: "Platform-wide",
            icon: CreditCard,
            gradient: "from-orange-500 to-amber-600",
        },
        {
            title: "Developers",
            value: stats?.user_counts?.developer || 0,
            subValue: "Registered",
            icon: Activity,
            gradient: "from-fuchsia-500 to-pink-600",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Admin Dashboard
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Platform overview and monitoring
                </p>
            </div>

            {/* Stats Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="dark:bg-slate-800 dark:border-slate-700">
                            <CardContent className="p-6">
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat) => (
                        <Card key={stat.title} className="dark:bg-slate-800 dark:border-slate-700">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            {stat.title}
                                        </p>
                                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                            {stat.value}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                            {stat.subValue}
                                        </p>
                                    </div>
                                    <div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}
                                    >
                                        <stat.icon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* User Breakdown */}
            {stats && (
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg">User Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {Object.entries(stats.user_counts || {}).map(([role, count]) => (
                                <div
                                    key={role}
                                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center"
                                >
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {count as number}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                                        {role}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Project Status Breakdown */}
            {stats && Object.keys(stats.project_status_counts || {}).length > 0 && (
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg">Project Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(stats.project_status_counts || {}).map(
                                ([status, count]) => (
                                    <div
                                        key={status}
                                        className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                                    >
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                                            {count as number}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {status.replace(/_/g, " ")}
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
