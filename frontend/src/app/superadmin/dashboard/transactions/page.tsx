"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { superadminApi } from "@/lib/api";

interface Transaction {
    id: number;
    user_id: number;
    user_email: string | null;
    type: string;
    status: string;
    quantity: number;
    project_id: number | null;
    project_name: string | null;
    amount_cents: number | null;
    created_at: string;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => { fetchTransactions(); }, [page, typeFilter, statusFilter]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const data = await superadminApi.getTransactions({
                page,
                page_size: 10,
                tx_type: typeFilter !== "all" ? typeFilter : undefined,
                status: statusFilter !== "all" ? statusFilter : undefined,
            });
            setTransactions(data.items);
            setTotalPages(data.total_pages);
            setTotal(data.total);
        } catch (err) {
            console.error("Failed to fetch transactions", err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (cents: number | null) => {
        if (!cents) return "-";
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
    };

    const getTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            PURCHASE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            SALE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            ISSUANCE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            RETIREMENT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            TRANSFER: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
        };
        return <Badge className={colors[type] || "bg-slate-100"}>{type}</Badge>;
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: "bg-amber-100 text-amber-700",
            COMPLETED: "bg-green-100 text-green-700",
            FAILED: "bg-red-100 text-red-700",
            CANCELLED: "bg-slate-100 text-slate-700",
        };
        return <Badge className={colors[status] || "bg-slate-100"}>{status}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h1>
                <p className="text-slate-500 dark:text-slate-400">{total} total transactions</p>
            </div>

            {/* Filters */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-full sm:w-40 dark:bg-slate-700 dark:border-slate-600">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="PURCHASE">Purchase</SelectItem>
                                <SelectItem value="SALE">Sale</SelectItem>
                                <SelectItem value="ISSUANCE">Issuance</SelectItem>
                                <SelectItem value="RETIREMENT">Retirement</SelectItem>
                                <SelectItem value="TRANSFER">Transfer</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-full sm:w-40 dark:bg-slate-700 dark:border-slate-600">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">No transactions found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">#{t.id}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{t.user_email}</td>
                                            <td className="px-6 py-4">{getTypeBadge(t.type)}</td>
                                            <td className="px-6 py-4 text-slate-900 dark:text-white">{t.quantity}</td>
                                            <td className="px-6 py-4 text-slate-900 dark:text-white">{formatCurrency(t.amount_cents)}</td>
                                            <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{new Date(t.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
