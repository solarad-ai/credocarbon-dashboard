"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, FileCheck, Plus, Search, Download, Eye, Calendar,
    Building2, Leaf, CheckCircle2, Clock, XCircle, Loader2
} from "lucide-react";
import { downloadRetirementCertificate, generateRetirementCertificate, printCertificate } from "@/lib/reports";
import { retirementApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Retirement {
    id: number;
    certificate_id: string | null;
    project_name: string;
    project_code: string;
    registry: string;
    vintage: number;
    quantity: number;
    retirement_date: string | null;
    beneficiary: string;
    beneficiary_address: string | null;
    purpose: string | null;
    status: string;
    serial_range: string | null;
}

interface RetirementSummary {
    total_retired: number;
    total_co2_offset: number;
    certificates_issued: number;
    pending_retirements: number;
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
    COMPLETED: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
    PENDING: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
    FAILED: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export default function BuyerRetirementsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [retirements, setRetirements] = useState<Retirement[]>([]);
    const [summary, setSummary] = useState<RetirementSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch retirements from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [retirementsData, summaryData] = await Promise.all([
                    retirementApi.getAll(),
                    retirementApi.getSummary()
                ]);
                setRetirements(retirementsData);
                setSummary(summaryData);
                setError(null);
            } catch (err) {
                console.error("Error fetching retirements:", err);
                setError("Failed to load retirements. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredRetirements = retirements.filter(ret => {
        const matchesSearch = ret.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ret.certificate_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ret.purpose?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || ret.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <FileCheck className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-xl">Retirements</h1>
                                <p className="text-sm text-muted-foreground">Manage your carbon credit retirements</p>
                            </div>
                        </div>
                    </div>
                    <Link href="/dashboard/buyer/retirements/new">
                        <Button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            New Retirement
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="card-hover">
                            <CardContent className="pt-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                                    <Leaf className="h-6 w-6 text-purple-600" />
                                </div>
                                <div className="text-2xl font-bold text-gradient">
                                    {(summary?.total_retired || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">Credits Retired</p>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardContent className="pt-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                    {(summary?.total_co2_offset || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">tCO₂e Offset</p>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardContent className="pt-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                                    <FileCheck className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {summary?.certificates_issued || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">Certificates Issued</p>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardContent className="pt-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-3">
                                    <Clock className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {summary?.pending_retirements || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">Pending</p>
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
                                        placeholder="Search by project, certificate ID, or purpose..."
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
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Retirements List */}
                    <div className="space-y-4">
                        {filteredRetirements.map((retirement) => {
                            const status = statusConfig[retirement.status];
                            const StatusIcon = status.icon;

                            return (
                                <Card key={retirement.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {retirement.certificate_id ? (
                                                        <Badge variant="outline" className="font-mono">
                                                            {retirement.certificate_id}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                    <Badge className={cn(status.color)}>
                                                        <StatusIcon className="mr-1 h-3 w-3" />
                                                        {retirement.status}
                                                    </Badge>
                                                </div>

                                                <h3 className="font-semibold text-lg mb-1">{retirement.project_name}</h3>
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    {retirement.project_code} • {retirement.registry} • Vintage {retirement.vintage}
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div className="flex items-start gap-2">
                                                        <Leaf className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                        <div>
                                                            <p className="text-muted-foreground">Quantity</p>
                                                            <p className="font-medium">{retirement.quantity.toLocaleString()} tCO₂e</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                        <div>
                                                            <p className="text-muted-foreground">Beneficiary</p>
                                                            <p className="font-medium">{retirement.beneficiary}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <FileCheck className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                        <div>
                                                            <p className="text-muted-foreground">Purpose</p>
                                                            <p className="font-medium">{retirement.purpose}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                        <div>
                                                            <p className="text-muted-foreground">Retirement Date</p>
                                                            <p className="font-medium">
                                                                {retirement.retirement_date
                                                                    ? new Date(retirement.retirement_date).toLocaleDateString()
                                                                    : "Processing..."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex lg:flex-col gap-2">
                                                {retirement.status === "COMPLETED" && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                const html = generateRetirementCertificate({
                                                                    certificateId: retirement.certificate_id || '',
                                                                    beneficiary: retirement.beneficiary,
                                                                    quantity: retirement.quantity,
                                                                    projectName: retirement.project_name,
                                                                    vintage: retirement.vintage,
                                                                    retirementDate: retirement.retirement_date || '',
                                                                    registry: retirement.registry
                                                                });
                                                                printCertificate(html);
                                                            }}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Certificate
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                downloadRetirementCertificate({
                                                                    certificateId: retirement.certificate_id || '',
                                                                    beneficiary: retirement.beneficiary,
                                                                    quantity: retirement.quantity,
                                                                    projectName: retirement.project_name,
                                                                    vintage: retirement.vintage,
                                                                    retirementDate: retirement.retirement_date || '',
                                                                    registry: retirement.registry
                                                                });
                                                            }}
                                                        >
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download PDF
                                                        </Button>
                                                    </>
                                                )}
                                                {retirement.status === "PENDING" && (
                                                    <Button variant="outline" size="sm" disabled>
                                                        <Clock className="mr-2 h-4 w-4" />
                                                        Processing...
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {retirement.serial_range && (
                                            <div className="mt-4 pt-4 border-t">
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    Serial Range: {retirement.serial_range}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {filteredRetirements.length === 0 && (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No retirements found</p>
                                    <Link href="/dashboard/buyer/retirements/new">
                                        <Button variant="link" className="mt-2">
                                            Create your first retirement
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
