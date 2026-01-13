"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { superadminApi } from "@/lib/api";

interface Analytics {
    user_growth: { date: string; count: number }[];
    transaction_trends: { date: string; count: number }[];
    project_type_breakdown: { type: string; count: number }[];
    revenue_metrics: { total_revenue_cents: number; total_transactions: number };
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAnalytics(); }, []);

    const fetchAnalytics = async () => {
        try {
            const data = await superadminApi.getAnalytics();
            setAnalytics(data);
        } catch (err) {
            console.error("Failed to fetch analytics", err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (cents: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Analytics</h1>
                <p className="text-slate-500 dark:text-slate-400">Insights and metrics across the platform</p>
            </div>

            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Total Revenue</p>
                                <p className="text-3xl font-bold mt-1">
                                    {formatCurrency(analytics?.revenue_metrics.total_revenue_cents || 0)}
                                </p>
                            </div>
                            <DollarSign className="h-12 w-12 text-green-300" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Completed Transactions</p>
                                <p className="text-3xl font-bold mt-1">
                                    {analytics?.revenue_metrics.total_transactions || 0}
                                </p>
                            </div>
                            <TrendingUp className="h-12 w-12 text-blue-300" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Project Type Breakdown */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Project Type Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {analytics?.project_type_breakdown.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No project data available</p>
                    ) : (
                        <div className="space-y-4">
                            {analytics?.project_type_breakdown.map((item, idx) => {
                                const total = analytics.project_type_breakdown.reduce((sum, i) => sum + i.count, 0);
                                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                                return (
                                    <div key={idx}>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-slate-900 dark:text-white font-medium">{item.type}</span>
                                            <span className="text-slate-500">{item.count} projects</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* User Growth */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Growth (Last 7 Days)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                        {analytics?.user_growth.slice(-7).map((item, idx) => (
                            <div key={idx} className="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                                <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString("en", { weekday: "short" })}</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{item.count}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
