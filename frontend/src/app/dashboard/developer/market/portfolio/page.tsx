"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Wallet, Package, Download, Upload, Filter, Search,
    Plus, ArrowRight, ChevronDown, BarChart3, Globe, Calendar, Loader2
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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

const typeColors: Record<string, string> = {
    sale: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    purchase: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    transfer_out: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    transfer_in: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    retirement: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    issuance: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

export default function PortfolioPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [registryFilter, setRegistryFilter] = useState<string>("all");
    const [summary, setSummary] = useState<WalletSummary | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [summaryData, txData] = await Promise.all([
                walletApi.getSummary(),
                walletApi.getTransactions(10)
            ]);
            setSummary(summaryData);
            setTransactions(txData);
        } catch (err) {
            console.error("Error fetching portfolio data:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredHoldings = (summary?.holdings || []).filter(holding => {
        const matchesSearch = holding.project_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRegistry = registryFilter === "all" || holding.registry === registryFilter;
        return matchesSearch && matchesRegistry;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading portfolio...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Credit Portfolio</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your carbon credit inventory</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Link href="/dashboard/developer/market/sell-orders/create">
                        <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Sell Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-gradient">
                            {(summary?.total_credits || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Total Credits</p>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                            {(summary?.available_credits || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Available</p>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">
                            {(summary?.locked_credits || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Listed for Sale</p>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">
                            0
                        </div>
                        <p className="text-xs text-muted-foreground">Transferred</p>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-600">
                            {(summary?.retired_credits || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Retired</p>
                    </CardContent>
                </Card>
                <Card className="card-hover bg-gradient-to-br from-carbon-500 to-carbon-700 text-white">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                            ${((summary?.total_value || 0) / 1000000).toFixed(2)}M
                        </div>
                        <p className="text-xs text-white/70">Est. Value</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="holdings">

                <TabsList>
                    <TabsTrigger value="holdings">Credit Holdings</TabsTrigger>
                    <TabsTrigger value="transactions">Transaction History</TabsTrigger>
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

                    {/* Holdings List */}
                    <div className="space-y-4">
                        {filteredHoldings.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No credit holdings found</p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredHoldings.map((holding) => (
                                <Card key={holding.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-lg">{holding.project_name}</h3>
                                                    <Badge variant="outline">{holding.registry}</Badge>
                                                    <Badge className="bg-primary/10 text-primary">{holding.vintage}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    {holding.project_type}
                                                </p>
                                                {holding.serial_start && (
                                                    <p className="text-xs text-muted-foreground font-mono">
                                                        Serial: {holding.serial_start} — {holding.serial_end}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="lg:w-96 space-y-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Total Credits</span>
                                                    <span className="font-semibold">{holding.quantity.toLocaleString()}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex gap-1">
                                                        <div
                                                            className="h-2 rounded-full bg-green-500"
                                                            style={{ width: `${(holding.available / holding.quantity) * 100}%` }}
                                                        />
                                                        <div
                                                            className="h-2 rounded-full bg-blue-500"
                                                            style={{ width: `${(holding.locked / holding.quantity) * 100}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex gap-4 text-xs">
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                                            Available: {holding.available.toLocaleString()}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                            Listed: {holding.locked.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-sm pt-2 border-t">
                                                    <span className="text-muted-foreground">Est. Price</span>
                                                    <span className="font-semibold text-gradient">${holding.unit_price.toFixed(2)}/credit</span>
                                                </div>
                                            </div>

                                            <div className="flex lg:flex-col gap-2">
                                                <Button variant="outline" size="sm" className="flex-1">
                                                    List for Sale
                                                </Button>
                                                <Button variant="outline" size="sm" className="flex-1">
                                                    Transfer
                                                </Button>
                                                <Button variant="outline" size="sm" className="flex-1">
                                                    Retire
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Transactions Tab */}
                <TabsContent value="transactions">
                    <Card>
                        <CardContent className="p-0">
                            {transactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">No transactions yet</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Project</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            <TableHead>Counterparty</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((tx) => (
                                            <TableRow key={tx.id}>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(tx.date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn(typeColors[tx.type] || "bg-gray-100 text-gray-700")}>
                                                        {tx.type.toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{tx.project_name}</TableCell>
                                                <TableCell className="text-right">
                                                    {tx.quantity.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {tx.counterparty || <span className="text-muted-foreground">—</span>}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {tx.amount && tx.amount > 0 ? `$${tx.amount.toLocaleString()}` : "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

