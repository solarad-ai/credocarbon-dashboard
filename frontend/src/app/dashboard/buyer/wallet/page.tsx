"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Wallet, Download, Search, Filter, Plus, ArrowRight,
    ChevronRight, Package, TrendingUp, FileCheck, Eye, Loader2
} from "lucide-react";
import { walletApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CreditHolding {
    id: number;
    project_id: number;
    project_name: string;
    project_type: string;
    registry: string;
    vintage: number;
    quantity: number;
    available: number;
    locked: number;
    unit_price: number;
    serial_start: string | null;
    serial_end: string | null;
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

interface WalletSummary {
    total_credits: number;
    total_value: number;
    available_credits: number;
    locked_credits: number;
    retired_credits: number;
    holdings: CreditHolding[];
}

const projectTypeColors: Record<string, string> = {
    "solar": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    "wind": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "biogas": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "redd+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const activityTypeConfig: Record<string, { color: string; label: string }> = {
    purchase: { color: "bg-green-100 text-green-700", label: "Purchase" },
    sale: { color: "bg-orange-100 text-orange-700", label: "Sale" },
    retirement: { color: "bg-purple-100 text-purple-700", label: "Retirement" },
    issuance: { color: "bg-blue-100 text-blue-700", label: "Issuance" },
    transfer_in: { color: "bg-teal-100 text-teal-700", label: "Transfer In" },
    transfer_out: { color: "bg-pink-100 text-pink-700", label: "Transfer Out" },
};

export default function BuyerWalletPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [registryFilter, setRegistryFilter] = useState<string>("all");
    const [walletData, setWalletData] = useState<WalletSummary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [summaryData, transactionsData] = await Promise.all([
                    walletApi.getSummary(),
                    walletApi.getTransactions(20)
                ]);
                setWalletData(summaryData);
                setTransactions(transactionsData);
                setError(null);
            } catch (err) {
                console.error("Error fetching wallet data:", err);
                setError("Failed to load wallet data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredHoldings = (walletData?.holdings || []).filter(holding => {
        const matchesSearch = holding.project_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRegistry = registryFilter === "all" || holding.registry === registryFilter;
        return matchesSearch && matchesRegistry;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-card border-b ">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/buyer">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-ocean-500/10 flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-ocean-500" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-xl">My Wallet</h1>
                                <p className="text-sm text-muted-foreground">Your carbon credit holdings</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Link href="/dashboard/buyer/marketplace">
                            <Button className="bg-gradient-to-r from-ocean-500 to-ocean-600 text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Buy Credits
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {error && (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="pt-4">
                                <p className="text-red-600">{error}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Card className="card-hover">
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-gradient">
                                    {(walletData?.total_credits || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">Total Credits</p>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-green-600">
                                    ${((walletData?.total_value || 0) / 1000).toFixed(1)}K
                                </div>
                                <p className="text-xs text-muted-foreground">Portfolio Value</p>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-blue-600">
                                    {(walletData?.available_credits || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">Available</p>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-orange-600">
                                    {(walletData?.locked_credits || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">Locked</p>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-purple-600">
                                    {(walletData?.retired_credits || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">Retired</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="holdings">
                        <TabsList>
                            <TabsTrigger value="holdings">Credit Holdings</TabsTrigger>
                            <TabsTrigger value="activity">Activity Log</TabsTrigger>
                        </TabsList>

                        {/* Holdings Tab */}
                        <TabsContent value="holdings" className="space-y-4">
                            {/* Filters */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by project name..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9 h-11"
                                            />
                                        </div>
                                        <Select value={registryFilter} onValueChange={setRegistryFilter}>
                                            <SelectTrigger className="w-full md:w-40 h-11">
                                                <SelectValue placeholder="All Registries" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Registries</SelectItem>
                                                <SelectItem value="VCS">VCS</SelectItem>
                                                <SelectItem value="GS">Gold Standard</SelectItem>
                                                <SelectItem value="ACR">ACR</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Holdings Cards */}
                            <div className="space-y-4">
                                {filteredHoldings.map((holding) => {
                                    const currentValue = holding.quantity * holding.unit_price;

                                    return (
                                        <Card key={holding.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="font-semibold text-lg">{holding.project_name}</h3>
                                                            <Badge className={cn(projectTypeColors[holding.project_type] || "bg-gray-100 text-gray-700")}>
                                                                {holding.project_type}
                                                            </Badge>
                                                            <Badge variant="outline">{holding.registry}</Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            Vintage {holding.vintage}
                                                        </p>
                                                        {holding.serial_start && (
                                                            <p className="text-xs text-muted-foreground font-mono">
                                                                Serial: {holding.serial_start} to {holding.serial_end}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="lg:w-72 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground text-sm">Quantity</span>
                                                            <span className="font-semibold">{holding.quantity.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground text-sm">Available</span>
                                                            <span className="font-semibold text-green-600">{holding.available.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground text-sm">Current Value</span>
                                                            <span className="font-semibold text-gradient">${currentValue.toLocaleString()}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex lg:flex-col gap-2">
                                                        <Link href={`/dashboard/buyer/retirements/new?holding=${holding.id}`}>
                                                            <Button variant="outline" size="sm" className="w-full">
                                                                <FileCheck className="mr-2 h-4 w-4" />
                                                                Retire
                                                            </Button>
                                                        </Link>
                                                        <Button variant="outline" size="sm">
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Details
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {filteredHoldings.length === 0 && (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">No credits found in your wallet</p>
                                            <Link href="/dashboard/buyer/marketplace">
                                                <Button variant="link" className="mt-2">
                                                    Browse the marketplace
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>

                        {/* Activity Tab */}
                        <TabsContent value="activity">
                            <Card>
                                <CardContent className="p-0 divide-y">
                                    {transactions.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <p className="text-muted-foreground">No transactions yet</p>
                                        </div>
                                    ) : (
                                        transactions.map((activity) => {
                                            const config = activityTypeConfig[activity.type] || { color: "bg-gray-100 text-gray-700", label: activity.type };

                                            return (
                                                <div key={activity.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <Badge className={cn(config.color)}>
                                                            {config.label}
                                                        </Badge>
                                                        <div>
                                                            <p className="font-medium">{activity.project_name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {activity.quantity.toLocaleString()} credits
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        {activity.amount && activity.amount > 0 && (
                                                            <p className="font-semibold">${activity.amount.toLocaleString()}</p>
                                                        )}
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(activity.date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
