"use client";

import { useEffect, useState } from "react";
import {
    Building2,
    FileCheck,
    Coins,
    MessageSquare,
    Clock,
    TrendingUp,
    FolderOpen,
    AlertTriangle,
    CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardStats {
    pending_reviews: number;
    in_progress_reviews: number;
    pending_issuances: number;
    total_credits_issued: number;
    open_queries: number;
    completed_this_month: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://credocarbon-api-641001192587.asia-south2.run.app";

export default function RegistryDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE_URL}/api/registry/dashboard/stats`, {
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
                    pending_reviews: 0,
                    in_progress_reviews: 0,
                    pending_issuances: 0,
                    total_credits_issued: 0,
                    open_queries: 0,
                    completed_this_month: 0,
                });
            }
        } catch (err) {
            // Show empty stats on error
            setStats({
                pending_reviews: 0,
                in_progress_reviews: 0,
                pending_issuances: 0,
                total_credits_issued: 0,
                open_queries: 0,
                completed_this_month: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    const statCards = [
        {
            title: "Pending Reviews",
            value: stats?.pending_reviews || 0,
            icon: <Clock className="h-5 w-5" />,
            color: "from-amber-500 to-orange-600",
            bgColor: "bg-amber-500/10",
            href: "/registry/dashboard/reviews?status=pending",
        },
        {
            title: "Pending Issuances",
            value: stats?.pending_issuances || 0,
            icon: <Coins className="h-5 w-5" />,
            color: "from-blue-500 to-indigo-600",
            bgColor: "bg-blue-500/10",
            href: "/registry/dashboard/issuances?status=pending",
        },
        {
            title: "Total Credits Issued",
            value: formatNumber(stats?.total_credits_issued || 0),
            icon: <TrendingUp className="h-5 w-5" />,
            color: "from-emerald-500 to-teal-600",
            bgColor: "bg-emerald-500/10",
            href: "/registry/dashboard/credits",
        },
        {
            title: "Open Queries",
            value: stats?.open_queries || 0,
            icon: <MessageSquare className="h-5 w-5" />,
            color: "from-purple-500 to-pink-600",
            bgColor: "bg-purple-500/10",
            href: "/registry/dashboard/queries",
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Registry Dashboard
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Carbon Credit Registry Control Panel
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
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
                        <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-200 dark:border-slate-700 hover:border-blue-500/50 dark:hover:border-blue-500/50">
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
                        <CardDescription>Common registry operations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/registry/dashboard/projects">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12">
                                <FolderOpen className="h-5 w-5 text-blue-500" />
                                <span>View All Projects</span>
                            </Button>
                        </Link>
                        <Link href="/registry/dashboard/reviews">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12">
                                <FileCheck className="h-5 w-5 text-emerald-500" />
                                <span>Review Projects</span>
                            </Button>
                        </Link>
                        <Link href="/registry/dashboard/issuances">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12">
                                <Coins className="h-5 w-5 text-amber-500" />
                                <span>Process Issuances</span>
                            </Button>
                        </Link>
                        <Link href="/registry/dashboard/credits">
                            <Button variant="outline" className="w-full justify-start gap-3 h-12">
                                <TrendingUp className="h-5 w-5 text-purple-500" />
                                <span>View Issued Credits</span>
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
                            {(stats?.pending_reviews || 0) > 0 && (
                                <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-amber-500" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            {stats?.pending_reviews} projects awaiting review
                                        </span>
                                    </div>
                                    <Link href="/registry/dashboard/reviews?status=pending">
                                        <Button size="sm" variant="ghost" className="text-amber-600">
                                            Review
                                        </Button>
                                    </Link>
                                </div>
                            )}
                            {(stats?.pending_issuances || 0) > 0 && (
                                <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <div className="flex items-center gap-3">
                                        <Coins className="h-5 w-5 text-blue-500" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            {stats?.pending_issuances} issuances pending
                                        </span>
                                    </div>
                                    <Link href="/registry/dashboard/issuances?status=pending">
                                        <Button size="sm" variant="ghost" className="text-blue-600">
                                            Process
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
                                    <Link href="/registry/dashboard/queries">
                                        <Button size="sm" variant="ghost" className="text-purple-600">
                                            View
                                        </Button>
                                    </Link>
                                </div>
                            )}
                            {(stats?.pending_reviews || 0) === 0 &&
                                (stats?.pending_issuances || 0) === 0 &&
                                (stats?.open_queries || 0) === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
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
