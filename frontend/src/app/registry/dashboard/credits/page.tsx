"use client";

import { useEffect, useState } from "react";
import {
    Coins,
    Search,
    Download,
    ChevronRight,
    Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface CreditBatch {
    id: number;
    batch_id: string;
    issuance_id: number;
    project_name: string;
    project_code: string;
    serial_start: string;
    serial_end: string;
    quantity: number;
    credit_type: string;
    vintage_year: number;
    registry_name: string;
    status: string;
    owner_name: string;
    created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://credocarbon-api-641001192587.asia-south2.run.app";

const statusColors: Record<string, string> = {
    OWNED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    LISTED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    LOCKED: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    TRANSFERRED: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    RETIRED: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

export default function RegistryCreditsPage() {
    const [credits, setCredits] = useState<CreditBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchCredits();
    }, []);

    const fetchCredits = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE_URL}/api/registry/credits`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCredits(data);
            } else {
                setCredits([]);
            }
        } catch (err) {
            setCredits([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredCredits = credits.filter((credit) => {
        return (
            credit.batch_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            credit.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            credit.project_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            credit.serial_start?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // Calculate totals
    const totalCredits = credits.reduce((sum, c) => sum + (c.quantity || 0), 0);
    const activeCredits = credits.filter((c) => c.status === "OWNED" || c.status === "LISTED").reduce((sum, c) => sum + c.quantity, 0);
    const retiredCredits = credits.filter((c) => c.status === "RETIRED").reduce((sum, c) => sum + c.quantity, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Package className="h-7 w-7 text-blue-500" />
                        Issued Credits
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        All credit batches issued through the registry
                    </p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Report
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Coins className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Credits Issued</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {totalCredits.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <Coins className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Active Credits</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {activeCredits.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-500/10 rounded-xl">
                                <Coins className="h-6 w-6 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Retired Credits</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {retiredCredits.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search by batch ID, project, or serial..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Credits List */}
            <div className="space-y-4">
                {filteredCredits.length === 0 ? (
                    <Card className="border-slate-200 dark:border-slate-700">
                        <CardContent className="py-12 text-center">
                            <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                No credit batches found
                            </h3>
                            <p className="text-slate-500 mt-1">
                                {searchTerm
                                    ? "Try adjusting your search terms"
                                    : "No credits have been issued yet"}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredCredits.map((credit) => (
                        <Card
                            key={credit.id}
                            className="border-slate-200 dark:border-slate-700"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                {credit.batch_id}
                                            </h3>
                                            <Badge className={statusColors[credit.status] || statusColors.OWNED}>
                                                {credit.status}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                            <span>{credit.project_name}</span>
                                            <span>•</span>
                                            <span>{credit.registry_name}</span>
                                            <span>•</span>
                                            <span>Vintage: {credit.vintage_year}</span>
                                            <span>•</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-300">
                                                {credit.quantity.toLocaleString()} credits
                                            </span>
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400">
                                            Serial: {credit.serial_start} to {credit.serial_end}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500">Owner</p>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {credit.owner_name || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
