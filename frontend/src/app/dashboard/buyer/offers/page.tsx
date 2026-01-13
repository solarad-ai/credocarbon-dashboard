"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Search, MessageSquare, Clock, CheckCircle2, XCircle,
    DollarSign, Calendar, TrendingUp, Send, Filter, Loader2
} from "lucide-react";
import { marketplaceApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Offer {
    id: number;
    listing_id: number;
    project_name: string;
    seller_name: string;
    quantity: number;
    price_per_ton: number;
    total_value: number;
    vintage: number;
    registry: string;
    status: string;
    created_at: string;
    expires_at: string | null;
    message: string | null;
}

export default function OffersPage() {
    const [activeTab, setActiveTab] = useState("active");
    const [searchQuery, setSearchQuery] = useState("");
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const data = await marketplaceApi.getMyOffers();
            setOffers(data);
        } catch (err) {
            console.error("Error fetching offers:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { className: string; label: string }> = {
            pending: { className: "bg-yellow-100 text-yellow-700", label: "Pending Response" },
            accepted: { className: "bg-green-100 text-green-700", label: "Accepted" },
            rejected: { className: "bg-red-100 text-red-700", label: "Rejected" },
            counter: { className: "bg-blue-100 text-blue-700", label: "Counter Offer" },
            expired: { className: "bg-gray-100 text-gray-700", label: "Expired" },
        };
        const statusConfig = config[status] || config.pending;
        return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
    };

    const activeOffers = offers.filter(o => o.status === "pending" || o.status === "counter");
    const completedOffers = offers.filter(o => o.status === "accepted" || o.status === "rejected" || o.status === "expired");

    const filteredOffers = (activeTab === "active" ? activeOffers : completedOffers)
        .filter(o => !searchQuery || o.project_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const totalValue = offers.reduce((sum, o) => sum + (o.total_value || 0), 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading offers...</p>
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
                            <div className="w-10 h-10 rounded-lg bg-ocean-100 flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-ocean-600" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-xl">Offers & Negotiations</h1>
                                <p className="text-sm text-muted-foreground">Manage your purchase offers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{activeOffers.length}</p>
                                        <p className="text-sm text-muted-foreground">Active</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{offers.filter(o => o.status === "accepted").length}</p>
                                        <p className="text-sm text-muted-foreground">Accepted</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{offers.filter(o => o.status === "counter").length}</p>
                                        <p className="text-sm text-muted-foreground">Counter</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-ocean-100 flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-ocean-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">${(totalValue / 1000).toFixed(1)}K</p>
                                        <p className="text-sm text-muted-foreground">Total Value</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search offers..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="active">Active ({activeOffers.length})</TabsTrigger>
                            <TabsTrigger value="completed">Completed ({completedOffers.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-6">
                            <div className="space-y-4">
                                {filteredOffers.map((offer) => (
                                    <Card key={offer.id} className={cn(
                                        "hover:shadow-md transition-shadow",
                                        offer.status === "counter" && "border-blue-200 bg-blue-50/30"
                                    )}>
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="font-semibold text-lg">{offer.project_name}</h3>
                                                    <p className="text-sm text-muted-foreground">Seller: {offer.seller_name}</p>
                                                </div>
                                                {getStatusBadge(offer.status)}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg mb-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Quantity</p>
                                                    <p className="font-semibold">{offer.quantity} tCO₂e</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Price/Ton</p>
                                                    <p className="font-semibold">${offer.price_per_ton.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Total Value</p>
                                                    <p className="font-semibold text-ocean-600">${offer.total_value.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Vintage</p>
                                                    <p className="font-semibold">{offer.vintage}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Registry</p>
                                                    <Badge variant="secondary">{offer.registry}</Badge>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(offer.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {(offer.status === "pending" || offer.status === "counter") && (
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm">
                                                            Counter
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Reject
                                                        </Button>
                                                        <Button size="sm" className="bg-gradient-to-r from-ocean-500 to-ocean-600 text-white">
                                                            <CheckCircle2 className="h-4 w-4 mr-1" />
                                                            Accept
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {filteredOffers.length === 0 && (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">No offers found</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
