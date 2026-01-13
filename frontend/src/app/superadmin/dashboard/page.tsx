"use client";

import { useEffect, useState } from "react";
import { Users, Activity, TrendingUp, DollarSign, FolderOpen, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { superadminApi } from "@/lib/api";

interface DashboardStats {
    total_users: number;
    total_developers: number;
    total_buyers: number;
    total_admins: number;
    total_projects: number;
    active_projects: number;
    total_credits_issued: number;
    total_credits_retired: number;
    total_transactions: number;
    marketplace_volume: number;
    recent_signups: number;
    pending_projects: number;
}

interface ActivityItem {
    id: number;
    action: string;
    entity_type: string;
    entity_id: string;
    actor_email: string | null;
    timestamp: string;
    details: any;
}

export default function SuperAdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsData, activityData] = await Promise.all([
                superadminApi.getStats(),
                superadminApi.getActivity(10),
            ]);
            setStats(statsData);
            setActivity(activityData);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(cents / 100);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    const statCards = [
        { title: "Total Users", value: formatNumber(stats?.total_users || 0), icon: Users, color: "from-blue-500 to-blue-600", subtext: `${stats?.recent_signups || 0} this week` },
        { title: "Total Projects", value: formatNumber(stats?.total_projects || 0), icon: FolderOpen, color: "from-green-500 to-green-600", subtext: `${stats?.pending_projects || 0} pending` },
        { title: "Credits Issued", value: formatNumber(stats?.total_credits_issued || 0), icon: TrendingUp, color: "from-purple-500 to-purple-600", subtext: "tCO₂e" },
        { title: "Marketplace Vol.", value: formatCurrency(stats?.marketplace_volume || 0), icon: DollarSign, color: "from-amber-500 to-amber-600", subtext: `${stats?.total_transactions || 0} transactions` },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-slate-500 dark:text-slate-400">Platform statistics and recent activity</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, idx) => (
                    <Card key={idx} className="dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.subtext}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* User Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-6">
                        <p className="text-sm text-slate-500">Developers</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.total_developers || 0}</p>
                    </CardContent>
                </Card>
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-6">
                        <p className="text-sm text-slate-500">Buyers</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.total_buyers || 0}</p>
                    </CardContent>
                </Card>
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-6">
                        <p className="text-sm text-slate-500">Admins</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.total_admins || 0}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {activity.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No recent activity</p>
                    ) : (
                        <div className="space-y-4">
                            {activity.map((item) => (
                                <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {item.action.replace(/_/g, " ")}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {item.entity_type} #{item.entity_id}
                                                {item.actor_email && ` by ${item.actor_email}`}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
