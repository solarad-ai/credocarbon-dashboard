"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi } from "@/lib/api";

interface Transaction {
    id: number;
    transaction_type: string;
    status: string;
    quantity: number;
    price_per_credit: number | null;
    total_amount: number | null;
    buyer_id: number | null;
    seller_id: number | null;
    created_at: string;
}

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchTransactions();
    }, [page, typeFilter, statusFilter]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params: any = { page, page_size: 20 };
            if (typeFilter !== "all") params.tx_type = typeFilter;
            if (statusFilter !== "all") params.status = statusFilter;
            const data = await adminApi.getTransactions(params);
            setTransactions(data.transactions || []);
            setTotalPages(data.total_pages || 1);
            setTotal(data.total || 0);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeBadgeColor = (type: string) => {
        const colors: Record<string, string> = {
            PURCHASE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            SALE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            TRANSFER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            RETIREMENT: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            ISSUANCE: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
        };
        return colors[type] || "bg-slate-100 text-slate-700";
    };

    const getStatusBadgeColor = (status: string) => {
        const colors: Record<string, string> = {
            COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
        };
        return colors[status] || "bg-slate-100 text-slate-700";
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return "-";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Transactions
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    View all platform transactions
                </p>
            </div>

            {/* Filters */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full md:w-40 dark:bg-slate-700 dark:border-slate-600">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="PURCHASE">Purchase</SelectItem>
                                <SelectItem value="SALE">Sale</SelectItem>
                                <SelectItem value="TRANSFER">Transfer</SelectItem>
                                <SelectItem value="RETIREMENT">Retirement</SelectItem>
                                <SelectItem value="ISSUANCE">Issuance</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-40 dark:bg-slate-700 dark:border-slate-600">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {transactions.length} of {total} transactions
                </p>
            </div>

            {/* Transactions Table */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fuchsia-500"></div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <CreditCard className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">No transactions found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">ID</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Type</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Status</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Quantity</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Price/Credit</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Total</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="p-4 text-sm font-mono text-slate-600 dark:text-slate-400">
                                                #{tx.id}
                                            </td>
                                            <td className="p-4">
                                                <Badge className={getTypeBadgeColor(tx.transaction_type)}>
                                                    {tx.transaction_type}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge className={getStatusBadgeColor(tx.status)}>
                                                    {tx.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm text-slate-900 dark:text-white font-medium">
                                                {tx.quantity?.toLocaleString() || "-"} tCO₂e
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                                {formatCurrency(tx.price_per_credit)}
                                            </td>
                                            <td className="p-4 text-sm text-slate-900 dark:text-white font-medium">
                                                {formatCurrency(tx.total_amount)}
                                            </td>
                                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                                                {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
