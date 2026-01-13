"use client";

import { useEffect, useState } from "react";
import {
    Coins,
    Clock,
    CheckCircle,
    Search,
    Plus,
    ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Issuance {
    id: number;
    project_id: number;
    project_name: string;
    project_code: string;
    registry_name: string;
    credit_type: string;
    vintage_year: number;
    total_credits: number;
    status: string;
    registry_reference: string | null;
    issued_at: string | null;
    created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://credocarbon-api-641001192587.asia-south2.run.app";

const statusColors: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    PROCESSING: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    ISSUED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    FAILED: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function RegistryIssuancesPage() {
    const [issuances, setIssuances] = useState<Issuance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        fetchIssuances();
    }, []);

    const fetchIssuances = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE_URL}/api/registry/issuances`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setIssuances(data);
            } else {
                setIssuances([]);
            }
        } catch (err) {
            setIssuances([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredIssuances = issuances.filter((issuance) => {
        const matchesSearch =
            issuance.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issuance.project_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issuance.registry_reference?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || issuance.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Calculate totals
    const totalCredits = issuances.reduce((sum, i) => sum + (i.total_credits || 0), 0);
    const pendingCount = issuances.filter((i) => i.status === "PENDING").length;
    const issuedCount = issuances.filter((i) => i.status === "ISSUED").length;

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
                        <Coins className="h-7 w-7 text-blue-500" />
                        Credit Issuances
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage carbon credit issuances
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <Coins className="h-6 w-6 text-emerald-500" />
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
                            <div className="p-3 bg-amber-500/10 rounded-xl">
                                <Clock className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Pending Issuances</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {pendingCount}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <CheckCircle className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Completed Issuances</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {issuedCount}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search issuances..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filterStatus === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterStatus("all")}
                        className={filterStatus === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                        All
                    </Button>
                    <Button
                        variant={filterStatus === "PENDING" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterStatus("PENDING")}
                        className={filterStatus === "PENDING" ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={filterStatus === "ISSUED" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterStatus("ISSUED")}
                        className={filterStatus === "ISSUED" ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                        Issued
                    </Button>
                </div>
            </div>

            {/* Issuances List */}
            <div className="space-y-4">
                {filteredIssuances.length === 0 ? (
                    <Card className="border-slate-200 dark:border-slate-700">
                        <CardContent className="py-12 text-center">
                            <Coins className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                No issuances found
                            </h3>
                            <p className="text-slate-500 mt-1">
                                {searchTerm
                                    ? "Try adjusting your search terms"
                                    : "No issuance records yet"}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredIssuances.map((issuance) => (
                        <Link
                            key={issuance.id}
                            href={`/registry/dashboard/issuances/${issuance.id}`}
                        >
                            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-200 dark:border-slate-700 hover:border-blue-500/50 dark:hover:border-blue-500/50">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                    {issuance.project_name}
                                                </h3>
                                                <Badge variant="outline" className="text-xs">
                                                    {issuance.project_code}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                <span>{issuance.registry_name}</span>
                                                <span>•</span>
                                                <span>Vintage: {issuance.vintage_year}</span>
                                                <span>•</span>
                                                <span>{issuance.total_credits.toLocaleString()} credits</span>
                                                {issuance.registry_reference && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Ref: {issuance.registry_reference}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge className={statusColors[issuance.status] || statusColors.PENDING}>
                                                {issuance.status}
                                            </Badge>
                                            <ChevronRight className="h-5 w-5 text-slate-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
