"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Leaf, Calendar, MapPin, FileText, Download, Search,
    CheckCircle2, Clock, Filter, TreeDeciduous, Loader2
} from "lucide-react";
import { retirementApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Retirement {
    id: number;
    project_name: string;
    quantity: number;
    beneficiary_name: string;
    reason: string;
    vintage: number;
    registry: string;
    status: string;
    retirement_date: string;
    certificate_id: string | null;
}

export default function DeveloperRetirementsPage() {
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [retirements, setRetirements] = useState<Retirement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRetirements();
    }, []);

    const fetchRetirements = async () => {
        try {
            setLoading(true);
            const data = await retirementApi.getAll();
            setRetirements(data);
        } catch (err) {
            console.error("Error fetching retirements:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredRetirements = retirements.filter(r => {
        if (activeTab === "completed" && r.status !== "completed") return false;
        if (activeTab === "pending" && r.status !== "pending") return false;
        if (searchQuery && !r.project_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !r.beneficiary_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const totalRetired = retirements
        .filter(r => r.status === "completed")
        .reduce((sum, r) => sum + r.quantity, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading retirements...</p>
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
                        <TreeDeciduous className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Retirements</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Credits retired on behalf of buyers</p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                <Leaf className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalRetired.toLocaleString()}</p>
                                <p className="text-sm text-white/80">Total tCO₂e Retired</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{retirements.filter(r => r.status === "completed").length}</p>
                                <p className="text-sm text-muted-foreground">Completed</p>
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
                                <p className="text-2xl font-bold">{retirements.filter(r => r.status === "pending").length}</p>
                                <p className="text-sm text-muted-foreground">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>



            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by project or beneficiary..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All Retirements</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <div className="space-y-4">
                        {filteredRetirements.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <TreeDeciduous className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No retirements found</p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredRetirements.map((retirement) => (
                                <Card key={retirement.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center",
                                                    retirement.status === "completed"
                                                        ? "bg-green-100"
                                                        : "bg-yellow-100"
                                                )}>
                                                    {retirement.status === "completed" ? (
                                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                                    ) : (
                                                        <Clock className="h-6 w-6 text-yellow-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg mb-1">{retirement.project_name}</h3>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                                        <span className="flex items-center gap-1">
                                                            <Leaf className="h-3 w-3" />
                                                            {retirement.quantity.toLocaleString()} tCO₂e
                                                        </span>
                                                        <span>Vintage {retirement.vintage}</span>
                                                        <Badge variant="secondary">{retirement.registry}</Badge>
                                                    </div>
                                                    <p className="text-sm mb-1">
                                                        <span className="text-muted-foreground">Beneficiary:</span>{" "}
                                                        <span className="font-medium">{retirement.beneficiary_name}</span>
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{retirement.reason}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={cn(
                                                    retirement.status === "completed"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                )}>
                                                    {retirement.status === "completed" ? "Completed" : "Pending"}
                                                </Badge>
                                                <p className="text-sm text-muted-foreground mt-2 flex items-center justify-end gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {retirement.retirement_date}
                                                </p>
                                                {retirement.certificate_id && (
                                                    <Button variant="outline" size="sm" className="mt-3">
                                                        <Download className="h-4 w-4 mr-1" />
                                                        Certificate
                                                    </Button>
                                                )}
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

