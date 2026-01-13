"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Package, Plus, Search, Filter, MoreHorizontal, Edit, Trash2,
    Pause, Play, Eye, TrendingUp, Clock, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import { marketplaceApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SellOrder {
    id: number;
    project_name: string;
    project_type: string;
    registry: string;
    vintage: number;
    quantity_available: number;
    quantity_sold: number;
    price_per_ton: number;
    min_quantity: number;
    status: string;
    created_at: string;
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
    active: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
    paused: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Pause },
    fulfilled: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle2 },
    expired: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: Clock },
    cancelled: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export default function SellOrdersPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [orders, setOrders] = useState<SellOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await marketplaceApi.getMyListings();
            setOrders(data);
        } catch (err) {
            console.error("Error fetching sell orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.project_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalListed = orders.reduce((sum, o) => sum + o.quantity_available, 0);
    const totalSold = orders.reduce((sum, o) => sum + (o.quantity_sold || 0), 0);
    const activeOrders = orders.filter(o => o.status === "active").length;
    const totalRevenue = orders.reduce((sum, o) => sum + ((o.quantity_sold || 0) * o.price_per_ton), 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading sell orders...</p>
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
                        <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sell Orders</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your marketplace listings</p>
                    </div>
                </div>
                <Link href="/dashboard/developer/market/sell-orders/create">
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-lg">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Sell Order
                    </Button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                            {totalListed.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Total Listed</p>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                            {totalSold.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Sold</p>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">
                            {activeOrders}
                        </div>
                        <p className="text-xs text-muted-foreground">Active Orders</p>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">
                            0
                        </div>
                        <p className="text-xs text-muted-foreground">Pending Offers</p>
                    </CardContent>
                </Card>
                <Card className="card-hover bg-gradient-to-br from-carbon-500 to-carbon-700 text-white">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                            ${(totalRevenue / 1000).toFixed(1)}K
                        </div>
                        <p className="text-xs text-white/70">Total Revenue</p>
                    </CardContent>
                </Card>
            </div>



            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search orders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-11"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-40 h-11">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
                <CardContent className="p-0">
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No sell orders found</p>
                            <Link href="/dashboard/developer/market/sell-orders/create">
                                <Button variant="link" className="mt-2">
                                    Create your first sell order
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[280px]">Project</TableHead>
                                    <TableHead>Registry</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => {
                                    const status = statusConfig[order.status] || statusConfig.active;
                                    const totalQty = order.quantity_available + (order.quantity_sold || 0);
                                    const progress = totalQty > 0 ? ((order.quantity_sold || 0) / totalQty) * 100 : 0;

                                    return (
                                        <TableRow key={order.id} className="group">
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{order.project_name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{order.project_type}</span>
                                                        <span>•</span>
                                                        <span>Vintage {order.vintage}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{order.registry}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div>
                                                    <span className="font-medium">{order.quantity_available.toLocaleString()}</span>
                                                    <p className="text-xs text-muted-foreground">
                                                        Sold: {(order.quantity_sold || 0).toLocaleString()}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="w-24">
                                                    <Progress value={progress} className="h-2" />
                                                    <span className="text-xs text-muted-foreground">
                                                        {progress.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-gradient">
                                                ${order.price_per_ton.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(status.color)}>
                                                    {order.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="opacity-0 group-hover:opacity-100"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Order
                                                        </DropdownMenuItem>
                                                        {order.status === "active" && (
                                                            <DropdownMenuItem>
                                                                <Pause className="mr-2 h-4 w-4" />
                                                                Pause Order
                                                            </DropdownMenuItem>
                                                        )}
                                                        {order.status === "paused" && (
                                                            <DropdownMenuItem>
                                                                <Play className="mr-2 h-4 w-4" />
                                                                Activate Order
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Cancel Order
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

