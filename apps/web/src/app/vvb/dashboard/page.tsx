"use client";

import { useEffect, useState } from "react";
import {
    ClipboardCheck,
    CheckCircle2,
    FileSearch,
    MessageSquare,
    Clock,
    TrendingUp,
    FolderOpen,
    AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardStats {
    pending_validations: number;
    in_progress_validations: number;
    pending_verifications: number;
    in_progress_verifications: number;
    open_queries: number;
    completed_this_month: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://credocarbon-api-641001192587.asia-south2.run.app";

export default function VVBDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE_URL}/api/vvb/dashboard/stats`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else {
                // Show empty stats when API fails
                setStats({
                    pending_validations: 0,
                    in_progress_validations: 0,
                    pending_verifications: 0,
                    in_progress_verifications: 0,
                    open_queries: 0,
                    completed_this_month: 0,
                });
            }
        } catch (err) {
            // Show empty stats on error
            setStats({
                pending_validations: 0,
                in_progress_validations: 0,
                pending_verifications: 0,
                in_progress_verifications: 0,
                open_queries: 0,
                completed_this_month: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: "Pending Validations",
            value: stats?.pending_validations || 0,
            icon: <Clock className="h-5 w-5" />,
            color: "from-amber-500 to-orange-600",
            bgColor: "bg-amber-500/10",
            href: "/vvb/dashboard/validations?status=pending",
        },
        {
            title: "In-Progress Validations",
            value: stats?.in_progress_validations || 0,
            icon: <CheckCircle2 className="h-5 w-5" />,
            color: "from-emerald-500 to-teal-600",
            bgColor: "bg-emerald-500/10",
            href: "/vvb/dashboard/validations?status=in_progress",
        },
        {
            title: "Pending Verifications",
            value: stats?.pending_verifications || 0,
            icon: <FileSearch className="h-5 w-5" />,
            color: "from-blue-500 to-indigo-600",
            bgColor: "bg-blue-500/10",
            href: "/vvb/dashboard/verifications?status=pending",
        },
        {
            title: "Open Queries",
            value: stats?.open_queries || 0,
            icon: <MessageSquare className="h-5 w-5" />,
            color: "from-purple-500 to-pink-600",
            bgColor: "bg-purple-500/10",
            href: "/vvb/dashboard/queries",
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        VVB Dashboard
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Validation & Verification Body Control Panel
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {stats?.completed_this_month || 0} completed this month
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <Link key={index} href={stat.href}>
                        <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
                                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                        <div className={`bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                                            {stat.icon}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <Card className="border-slate-200 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                        <CardDescription>Common validation & verification tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/vvb/dashboard/projects">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12">
                                <FolderOpen className="h-5 w-5 text-emerald-500" />
                                <span>View Assigned Projects</span>
                            </Button>
                        </Link>
                        <Link href="/vvb/dashboard/validations">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12">
                                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                <span>Review Pending Validations</span>
                            </Button>
                        </Link>
                        <Link href="/vvb/dashboard/verifications">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12">
                                <FileSearch className="h-5 w-5 text-purple-500" />
                                <span>Review Verification Tasks</span>
                            </Button>
                        </Link>
                        <Link href="/vvb/dashboard/queries">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12">
                                <MessageSquare className="h-5 w-5 text-orange-500" />
                                <span>Manage Queries</span>
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Tasks Requiring Attention */}
                <Card className="border-slate-200 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Tasks Requiring Attention
                        </CardTitle>
                        <CardDescription>Items that need your immediate action</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(stats?.pending_validations || 0) > 0 && (
                                <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-amber-500" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            {stats?.pending_validations} validations awaiting review
                                        </span>
                                    </div>
                                    <Link href="/vvb/dashboard/validations?status=pending">
                                        <Button size="sm" variant="ghost" className="text-amber-600">
                                            Review
                                        </Button>
                                    </Link>
                                </div>
                            )}
                            {(stats?.open_queries || 0) > 0 && (
                                <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare className="h-5 w-5 text-purple-500" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            {stats?.open_queries} queries need responses
                                        </span>
                                    </div>
                                    <Link href="/vvb/dashboard/queries">
                                        <Button size="sm" variant="ghost" className="text-purple-600">
                                            View
                                        </Button>
                                    </Link>
                                </div>
                            )}
                            {(stats?.pending_verifications || 0) > 0 && (
                                <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <div className="flex items-center gap-3">
                                        <FileSearch className="h-5 w-5 text-blue-500" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            {stats?.pending_verifications} verifications pending
                                        </span>
                                    </div>
                                    <Link href="/vvb/dashboard/verifications?status=pending">
                                        <Button size="sm" variant="ghost" className="text-blue-600">
                                            Review
                                        </Button>
                                    </Link>
                                </div>
                            )}
                            {(stats?.pending_validations || 0) === 0 &&
                                (stats?.open_queries || 0) === 0 &&
                                (stats?.pending_verifications || 0) === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                                        <p>All caught up! No urgent tasks.</p>
                                    </div>
                                )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
