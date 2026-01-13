"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, ArrowUpRight, ArrowDownRight, Search, Filter, Clock,
    CheckCircle2, XCircle, Send, Wallet, Building2, User, Calendar, Loader2
} from "lucide-react";
import { walletApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

export default function TransfersPage() {
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showNewTransfer, setShowNewTransfer] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransfers();
    }, []);

    const fetchTransfers = async () => {
        try {
            setLoading(true);
            const data = await walletApi.getTransactions(20);
            // Filter to show only transfer transactions
            const transfers = data.filter((t: Transaction) =>
                t.type === "transfer_in" || t.type === "transfer_out"
            );
            setTransactions(transfers);
        } catch (err) {
            console.error("Error fetching transfers:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransfers = transactions.filter(t => {
        if (activeTab === "incoming" && t.type !== "transfer_in") return false;
        if (activeTab === "outgoing" && t.type !== "transfer_out") return false;
        if (searchQuery && t.counterparty && !t.counterparty.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const creditsReceived = transactions
        .filter(t => t.type === "transfer_in")
        .reduce((sum, t) => sum + t.quantity, 0);
    const creditsSent = transactions
        .filter(t => t.type === "transfer_out")
        .reduce((sum, t) => sum + t.quantity, 0);
    const pendingCount = transactions.filter(t => t.status === "pending").length;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
            case "failed":
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading transfers...</p>
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
                        <Send className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Credit Transfers</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Send and receive carbon credits</p>
                    </div>
                </div>
                <Button
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-lg"
                    onClick={() => setShowNewTransfer(true)}
                >
                    <Send className="mr-2 h-4 w-4" />
                    New Transfer
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <ArrowDownRight className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{creditsReceived.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Credits Received</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <ArrowUpRight className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{creditsSent.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Credits Sent</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{pendingCount}</p>
                                <p className="text-sm text-muted-foreground">Pending Transfers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>



            {/* New Transfer Form */}
            {showNewTransfer && (
                <Card className="border-primary/20 bg-primary/5 animate-fade-in">
                    <CardHeader>
                        <CardTitle>Initiate New Transfer</CardTitle>
                        <CardDescription>Transfer credits to another account or organization</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Recipient Wallet / Account ID</Label>
                                <Input placeholder="Enter wallet address or account ID" />
                            </div>
                            <div className="space-y-2">
                                <Label>Credit Type</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select credit type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="vcs">VCS Credits</SelectItem>
                                        <SelectItem value="gs">Gold Standard Credits</SelectItem>
                                        <SelectItem value="acr">ACR Credits</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Quantity (tCO₂e)</Label>
                                <Input type="number" placeholder="Enter amount" />
                            </div>
                            <div className="space-y-2">
                                <Label>Vintage</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select vintage" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2024">2024</SelectItem>
                                        <SelectItem value="2023">2023</SelectItem>
                                        <SelectItem value="2022">2022</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowNewTransfer(false)}>
                                Cancel
                            </Button>
                            <Button className="gradient-primary text-white">
                                <Send className="mr-2 h-4 w-4" />
                                Send Transfer
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters and Tabs */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by counterparty..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All Transfers</TabsTrigger>
                    <TabsTrigger value="incoming">Incoming</TabsTrigger>
                    <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <div className="space-y-3">
                        {filteredTransfers.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No transfers found</p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredTransfers.map((transfer) => (
                                <Card key={transfer.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                                transfer.type === "transfer_in"
                                                    ? "bg-green-100"
                                                    : "bg-blue-100"
                                            )}>
                                                {transfer.type === "transfer_in" ? (
                                                    <ArrowDownRight className="h-6 w-6 text-green-600" />
                                                ) : (
                                                    <ArrowUpRight className="h-6 w-6 text-blue-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold">
                                                        {transfer.type === "transfer_in" ? "From" : "To"}: {transfer.counterparty || "Unknown"}
                                                    </p>
                                                    {getStatusBadge(transfer.status)}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Wallet className="h-3 w-3" />
                                                        {transfer.quantity.toLocaleString()} tCO₂e
                                                    </span>
                                                    <span>{transfer.project_name}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {transfer.date}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

