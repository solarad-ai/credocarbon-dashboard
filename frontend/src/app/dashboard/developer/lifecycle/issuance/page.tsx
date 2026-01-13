"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, CheckCircle2, Clock, Coins, FileText, Download,
    Calendar, TrendingUp, Sparkles, Eye, Package, Wallet, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function CreditIssuancePage() {
    const [issuances, setIssuances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call - in future this would fetch from backend
        const fetchData = async () => {
            setLoading(true);
            // No backend API exists for issuance yet, so we return empty
            await new Promise(resolve => setTimeout(resolve, 500));
            setIssuances([]);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading issuance data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <Coins className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Credit Issuance</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Track issued carbon credits</p>
                    </div>
                </div>
                <Link href="/dashboard/developer/market/portfolio">
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-lg">
                        <Wallet className="mr-2 h-4 w-4" />
                        View Portfolio
                    </Button>
                </Link>
            </div>

            {/* Summary Cards - Empty state */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                <Coins className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">0</p>
                                <p className="text-sm text-white/80">Total Issued</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">0</p>
                                <p className="text-sm text-muted-foreground">Net After Buffer</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">0</p>
                                <p className="text-sm text-muted-foreground">Buffer Pool</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">0</p>
                                <p className="text-sm text-muted-foreground">Issuances</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Empty State */}
            <Card>
                <CardContent className="py-16 text-center">
                    <Coins className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Credits Issued Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        No carbon credits have been issued for your projects yet.
                        Credits are issued after successful verification by the registry.
                    </p>
                    <Link href="/dashboard/developer/lifecycle">
                        <Button variant="outline">
                            View Project Lifecycle
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

