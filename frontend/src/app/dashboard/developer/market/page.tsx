"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    TrendingUp, Wallet, Package, Send, TreeDeciduous, DollarSign,
    ArrowUpRight, ArrowDownRight, BarChart3, Activity, Clock, Loader2
} from "lucide-react";
import { walletApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WalletStats {
    portfolio_value: number;
    credits_available: number;
    active_listings: number;
    revenue_mtd: number;
}

interface Transaction {
    id: number;
    type: string;
    quantity: number;
    project_name: string;
    counterparty: string | null;
    amount: number | null;
    date: string;
    status: string;
}

const quickActions = [
    { href: "/dashboard/developer/market/portfolio", label: "Portfolio", icon: Wallet, description: "View your credit holdings" },
    { href: "/dashboard/developer/market/sell-orders", label: "Sell Orders", icon: Package, description: "Manage sell listings" },
    { href: "/dashboard/developer/market/transfers", label: "Transfers", icon: Send, description: "Send & receive credits" },
    { href: "/dashboard/developer/market/retirements", label: "Retirements", icon: TreeDeciduous, description: "View retired credits" },
];

export default function MarketOverviewPage() {
    const [stats, setStats] = useState<WalletStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsData, txData] = await Promise.all([
                walletApi.getStats(),
                walletApi.getTransactions(5)
            ]);
            setStats(statsData);
            setTransactions(txData);
        } catch (err) {
            console.error("Error fetching market data:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading market data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Market Operations</h1>
                <p className="text-muted-foreground">Manage your carbon credit trading activities</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Portfolio Value</p>
                                <p className="text-3xl font-bold">${((stats?.portfolio_value || 0) / 1000).toFixed(1)}K</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Available Credits</p>
                                <p className="text-3xl font-bold">{(stats?.credits_available || 0).toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-1">tCO₂e</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <Wallet className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Listings</p>
                                <p className="text-3xl font-bold">{stats?.active_listings || 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">Sell orders</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">This Month</p>
                                <p className="text-3xl font-bold">${((stats?.revenue_mtd || 0) / 1000).toFixed(1)}K</p>
                                <p className="text-xs text-muted-foreground mt-1">Revenue</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Link key={action.href} href={action.href}>
                            <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                            <action.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="font-semibold">{action.label}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Transactions & Market Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Recent Transactions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                        ) : (
                            <div className="space-y-4">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                tx.type === "sale" && "bg-green-100",
                                                tx.type === "purchase" && "bg-blue-100",
                                                tx.type === "transfer_out" && "bg-orange-100",
                                                tx.type === "issuance" && "bg-purple-100"
                                            )}>
                                                {tx.type === "sale" && <DollarSign className="h-4 w-4 text-green-600" />}
                                                {tx.type === "purchase" && <DollarSign className="h-4 w-4 text-blue-600" />}
                                                {tx.type === "transfer_out" && <Send className="h-4 w-4 text-orange-600" />}
                                                {tx.type === "issuance" && <ArrowDownRight className="h-4 w-4 text-purple-600" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{tx.project_name}</p>
                                                <p className="text-xs text-muted-foreground">{tx.date}</p>
                                            </div>
                                        </div>
                                        <Badge variant={tx.amount && tx.amount > 0 ? "default" : "secondary"}>
                                            {tx.amount ? `$${tx.amount.toLocaleString()}` : `${tx.quantity} VCUs`}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Market Insights - Keep as static for now */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Market Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Average VCS Price</span>
                                    <Badge className="bg-green-100 text-green-700">+5.2%</Badge>
                                </div>
                                <p className="text-2xl font-bold">$8.50 <span className="text-sm font-normal text-muted-foreground">/tCO₂e</span></p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Gold Standard Price</span>
                                    <Badge className="bg-green-100 text-green-700">+3.8%</Badge>
                                </div>
                                <p className="text-2xl font-bold">$12.00 <span className="text-sm font-normal text-muted-foreground">/tCO₂e</span></p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Market Volume (24h)</span>
                                    <Badge variant="secondary">Stable</Badge>
                                </div>
                                <p className="text-2xl font-bold">45,200 <span className="text-sm font-normal text-muted-foreground">tCO₂e</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
