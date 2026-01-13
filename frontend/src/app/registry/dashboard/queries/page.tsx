"use client";

import { useEffect, useState } from "react";
import {
    MessageSquare,
    Clock,
    CheckCircle,
    Send,
    Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Query {
    id: number;
    review_id: number;
    category: string;
    query_text: string;
    status: string;
    created_by: number;
    created_at: string;
    resolved_at: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://credocarbon-api-641001192587.asia-south2.run.app";

const statusColors: Record<string, string> = {
    OPEN: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    RESPONDED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    RESOLVED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    CLOSED: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

const categoryLabels: Record<string, string> = {
    DOCUMENTATION: "Documentation",
    METHODOLOGY: "Methodology",
    VERIFICATION: "Verification",
    COMPLIANCE: "Compliance",
    SAFEGUARDS: "Safeguards",
    OTHER: "Other",
};

export default function RegistryQueriesPage() {
    const [queries, setQueries] = useState<Query[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        fetchQueries();
    }, []);

    const fetchQueries = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE_URL}/api/registry/queries`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setQueries(data);
            } else {
                setQueries([]);
            }
        } catch (err) {
            setQueries([]);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (queryId: number) => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE_URL}/api/registry/queries/${queryId}/resolve`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                fetchQueries();
            }
        } catch (err) {
            console.error("Failed to resolve query");
        }
    };

    const filteredQueries = queries.filter((query) => {
        const matchesSearch =
            query.query_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            query.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || query.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const openQueries = queries.filter((q) => q.status === "OPEN").length;
    const respondedQueries = queries.filter((q) => q.status === "RESPONDED").length;
    const resolvedQueries = queries.filter((q) => q.status === "RESOLVED").length;

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
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <MessageSquare className="h-7 w-7 text-blue-500" />
                    Query Management
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Manage clarification requests and responses
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl">
                                <Clock className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Open</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {openQueries}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Send className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Awaiting Review</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {respondedQueries}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 dark:border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <CheckCircle className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Resolved</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {resolvedQueries}
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
                        placeholder="Search queries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    {["all", "OPEN", "RESPONDED", "RESOLVED"].map((status) => (
                        <Button
                            key={status}
                            variant={filterStatus === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterStatus(status)}
                            className={filterStatus === status ? "bg-blue-600 hover:bg-blue-700" : ""}
                        >
                            {status === "all" ? "All" : status}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Queries List */}
            <div className="space-y-4">
                {filteredQueries.length === 0 ? (
                    <Card className="border-slate-200 dark:border-slate-700">
                        <CardContent className="py-12 text-center">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                No queries found
                            </h3>
                            <p className="text-slate-500 mt-1">
                                {searchTerm ? "Try adjusting your search" : "No queries raised yet"}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredQueries.map((query) => (
                        <Card key={query.id} className="border-slate-200 dark:border-slate-700">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge variant="outline" className="text-xs">
                                                {categoryLabels[query.category] || query.category}
                                            </Badge>
                                            <Badge className={statusColors[query.status]}>
                                                {query.status}
                                            </Badge>
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-300 mb-2">
                                            {query.query_text}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Created: {new Date(query.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    {query.status === "RESPONDED" && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleResolve(query.id)}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Mark Resolved
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
