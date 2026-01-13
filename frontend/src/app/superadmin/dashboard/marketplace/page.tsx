"use client";

import { useEffect, useState } from "react";
import { Store, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { superadminApi } from "@/lib/api";

interface Listing {
    id: number;
    seller_id: number;
    seller_email: string;
    project_id: number;
    project_name: string;
    vintage: number;
    quantity: number;
    quantity_sold: number;
    price_per_ton_cents: number;
    status: string;
    created_at: string;
}

export default function MarketplacePage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => { fetchListings(); }, [page, statusFilter]);

    const fetchListings = async () => {
        setLoading(true);
        try {
            const data = await superadminApi.getListings({
                page,
                page_size: 10,
                status: statusFilter !== "all" ? statusFilter : undefined,
            });
            setListings(data.items);
            setTotalPages(data.total_pages);
            setTotal(data.total);
        } catch (err) {
            console.error("Failed to fetch listings", err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (cents: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            sold: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            expired: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
        };
        return <Badge className={colors[status] || "bg-slate-100"}>{status}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marketplace</h1>
                <p className="text-slate-500 dark:text-slate-400">{total} total listings</p>
            </div>

            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-4">
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                        <SelectTrigger className="w-full sm:w-40 dark:bg-slate-700 dark:border-slate-600">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="sold">Sold</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">No listings found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Project</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Seller</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Vintage</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Quantity</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Price</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {listings.map((l) => (
                                        <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{l.project_name || `Project #${l.project_id}`}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{l.seller_email}</td>
                                            <td className="px-6 py-4 text-slate-900 dark:text-white">{l.vintage}</td>
                                            <td className="px-6 py-4 text-slate-900 dark:text-white">{l.quantity_sold}/{l.quantity}</td>
                                            <td className="px-6 py-4 text-slate-900 dark:text-white">{formatCurrency(l.price_per_ton_cents)}/t</td>
                                            <td className="px-6 py-4">{getStatusBadge(l.status)}</td>
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
                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
